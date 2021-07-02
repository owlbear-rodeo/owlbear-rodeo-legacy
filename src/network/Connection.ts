import SimplePeer from "simple-peer";
import { encode, decode } from "@msgpack/msgpack";
import shortid from "shortid";

import blobToBuffer from "../helpers/blobToBuffer";

// Limit buffer size to 16kb to avoid issues with chrome packet size
// http://viblast.com/blog/2015/2/5/webrtc-data-channel-message-size/
const MAX_BUFFER_SIZE = 16000;

class Connection extends SimplePeer {
  currentChunks: any;
  dataChannels: any;

  constructor(props: any) {
    super(props);
    this.currentChunks = {} as Blob;
    this.dataChannels = {};
    this.on("data", this.handleData);
    this.on("datachannel", this.handleDataChannel);
  }

  // Intercept the data event with decoding and chunking support
  handleData(packed: any) {
    const unpacked: any = decode(packed);
    // If the special property __chunked is set and true
    // The data is a partial chunk of the a larger file
    // So wait until all chunks are collected and assembled
    // before emitting the dataComplete event
    if (unpacked.__chunked) {
      let chunk: any = this.currentChunks[unpacked.id] || {
        data: [],
        count: 0,
        total: unpacked.total,
      };
      chunk.data[unpacked.index] = unpacked.data;
      chunk.count++;
      this.currentChunks[unpacked.id] = chunk;

      this.emit("dataProgress", {
        id: unpacked.id,
        count: chunk.count,
        total: chunk.total,
      });

      // All chunks have been loaded
      if (chunk.count === chunk.total) {
        // Merge chunks with a blob
        // TODO: Look at a more efficient way to recombine buffer data
        const merged = new Blob(chunk.data);
        blobToBuffer(merged).then((buffer) => {
          this.emit("dataComplete", decode(buffer));
          delete this.currentChunks[unpacked.id];
        });
      }
    } else {
      this.emit("dataComplete", unpacked);
    }
  }

  /**
   * Custom send function with encoding, chunking and data channel support
   * Uses `write` to send the data to allow for buffer / backpressure handling
   * @param {any} object
   * @param {string=} channel
   * @param {string=} chunkId Optional ID to use for chunking
   */
  sendObject(object: any, channel?: string, chunkId?: string) {
    try {
      const packedData = encode(object);
      const chunks = this.chunk(packedData, chunkId);
      for (let chunk of chunks) {
        if (this.dataChannels[channel]) {
          this.dataChannels[channel].write(encode(chunk));
        } else {
          this.write(encode(chunk));
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Override the create data channel function to store our own named reference to it
  // and to use our custom data handler
  createDataChannel(channelName: string, channelConfig: any, opts: any) {
    // TODO: resolve createDataChannel
    // @ts-ignore
    const channel = super.createDataChannel(channelName, channelConfig, opts);
    this.handleDataChannel(channel);
    return channel;
  }

  handleDataChannel(channel: any) {
    const channelName = channel.channelName;
    this.dataChannels[channelName] = channel;
    channel.on("data", this.handleData.bind(this));
    channel.on("error", (error: any) => {
      this.emit("error", error);
    });
  }

  // Converted from https://github.com/peers/peerjs/
  /**
   * Chunk byte array
   * @param {Uint8Array} data
   * @param {string=} chunkId
   * @returns {Uint8Array[]}
   */
  chunk(data: Uint8Array, chunkId?: string) {
    const chunks = [];
    const size = data.byteLength;
    const total = Math.ceil(size / MAX_BUFFER_SIZE);
    const id = chunkId || shortid.generate();

    let index = 0;
    let start = 0;

    while (start < size) {
      const end = Math.min(size, start + MAX_BUFFER_SIZE);
      const slice = data.slice(start, end);

      const chunk = {
        __chunked: true,
        data: slice,
        id,
        index,
        total,
      };

      chunks.push(chunk);
      start = end;
      index++;
    }

    return chunks;
  }
}

export default Connection;

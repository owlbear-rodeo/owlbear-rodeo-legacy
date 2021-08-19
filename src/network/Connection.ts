import SimplePeer from "simple-peer";
import { encode, decode } from "@msgpack/msgpack";
import shortid from "shortid";

import blobToBuffer from "../helpers/blobToBuffer";

// Limit buffer size to 16kb to avoid issues with chrome packet size
// http://viblast.com/blog/2015/2/5/webrtc-data-channel-message-size/
const MAX_BUFFER_SIZE = 16000;

type NetworkChunk = {
  __chunked: boolean;
  data: Uint8Array;
  id: string;
  index: number;
  total: number;
};

type LocalChunk = {
  data: Uint8Array[];
  count: number;
  total: number;
};

export type DataProgressEvent = {
  id: string;
  count: number;
  total: number;
};

class Connection extends SimplePeer {
  currentChunks: Record<string, LocalChunk>;
  constructor(props: SimplePeer.Options) {
    super(props);
    this.currentChunks = {};
    this.on("data", this.handleData);
  }

  // Intercept the data event with decoding and chunking support
  handleData(packed: Uint8Array) {
    const unpacked = decode(packed) as NetworkChunk;
    // If the special property __chunked is set and true
    // The data is a partial chunk of the a larger file
    // So wait until all chunks are collected and assembled
    // before emitting the dataComplete event
    if (unpacked.__chunked) {
      let chunk = this.currentChunks[unpacked.id] || {
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
   * @param {string=} chunkId Optional ID to use for chunking
   */
  sendObject(object: any, chunkId?: string) {
    try {
      const packedData = encode(object);
      const chunks = this.chunk(packedData, chunkId);
      for (let chunk of chunks) {
        this.write(encode(chunk));
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Converted from https://github.com/peers/peerjs/
  /** Chunk byte array */
  chunk(data: Uint8Array, chunkId?: string): NetworkChunk[] {
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

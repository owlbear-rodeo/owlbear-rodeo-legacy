import SimplePeer from "simple-peer";
import { encode, decode } from "@msgpack/msgpack";
import shortid from "shortid";

import blobToBuffer from "./blobToBuffer";

// Limit buffer size to 16kb to avoid issues with chrome packet size
// http://viblast.com/blog/2015/2/5/webrtc-data-channel-message-size/
const MAX_BUFFER_SIZE = 16000;

class Peer extends SimplePeer {
  constructor(props) {
    super(props);
    this.currentChunks = {};

    this.on("data", (packed) => {
      const unpacked = decode(packed);
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
    });
  }

  send(data) {
    try {
      const packedData = encode(data);
      if (packedData.byteLength > MAX_BUFFER_SIZE) {
        const chunks = this.chunk(packedData);
        for (let chunk of chunks) {
          super.send(encode(chunk));
        }
        return;
      } else {
        super.send(packedData);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Converted from https://github.com/peers/peerjs/
  chunk(data) {
    const chunks = [];
    const size = data.byteLength;
    const total = Math.ceil(size / MAX_BUFFER_SIZE);
    const id = shortid.generate();

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

export default Peer;

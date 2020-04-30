import SimplePeer from "simple-peer";
import BinaryPack from "js-binarypack";
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
      const unpacked = BinaryPack.unpack(packed);
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
          const merged = BinaryPack.unpack(Buffer.concat(chunk.data));
          this.emit("dataComplete", merged);
          delete this.currentChunks[unpacked.id];
        }
      } else {
        this.emit("dataComplete", unpacked);
      }
    });
  }

  async sendPackedData(packedData) {
    const buffer = await blobToBuffer(packedData);
    super.send(buffer);
  }

  send(data) {
    const packedData = BinaryPack.pack(data);

    if (packedData.size > MAX_BUFFER_SIZE) {
      const chunks = this.chunk(packedData);
      for (let chunk of chunks) {
        this.sendPackedData(BinaryPack.pack(chunk));
      }
      return;
    } else {
      this.sendPackedData(packedData);
    }
  }

  // Converted from https://github.com/peers/peerjs/
  chunk(blob) {
    const chunks = [];
    const size = blob.size;
    const total = Math.ceil(size / MAX_BUFFER_SIZE);
    const id = shortid.generate();

    let index = 0;
    let start = 0;

    while (start < size) {
      const end = Math.min(size, start + MAX_BUFFER_SIZE);
      const slice = blob.slice(start, end);

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

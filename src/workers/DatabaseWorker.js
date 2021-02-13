import * as Comlink from "comlink";
import { importInto, exportDB } from "@mitchemmc/dexie-export-import";
import { encode } from "@msgpack/msgpack";

import { getDatabase } from "../database";

// Worker to load large amounts of database data on a separate thread
let service = {
  /**
   * Load either a whole table or individual item from the DB
   * @param {string} table Table to load from
   * @param {string=} key Optional database key to load, if undefined whole table will be loaded
   * @param {bool} excludeFiles Optional exclude files from loaded data when using whole table loading
   */
  async loadData(table, key, excludeFiles = true) {
    try {
      let db = getDatabase({});
      if (key) {
        // Load specific item
        return await db.table(table).get(key);
      } else {
        // Load entire table
        let items = [];
        // Use a cursor instead of toArray to prevent IPC max size error
        await db.table(table).each((item) => {
          if (excludeFiles) {
            const { file, resolutions, ...rest } = item;
            items.push(rest);
          } else {
            items.push(item);
          }
        });

        // Pack data with msgpack so we can use transfer to avoid memory issues
        const packed = encode(items);
        return Comlink.transfer(packed, [packed.buffer]);
      }
    } catch {}
  },

  /**
   * Export current database
   * @param {function} progressCallback
   */
  async exportData(progressCallback) {
    let db = getDatabase({});
    return await exportDB(db, {
      progressCallback,
      numRowsPerChunk: 1,
    });
  },

  /**
   * Import into current database
   * @param {Blob} data
   * @param {function} progressCallback
   */
  async importData(data, progressCallback) {
    let db = getDatabase({});
    await importInto(db, data, { progressCallback, overwriteValues: true });
  },
};

Comlink.expose(service);

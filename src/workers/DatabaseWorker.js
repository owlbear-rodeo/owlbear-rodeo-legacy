import * as Comlink from "comlink";
import { importDB, exportDB } from "dexie-export-import";

import { getDatabase } from "../database";

// Worker to load large amounts of database data on a separate thread
let obj = {
  data: null,
  /**
   * Load either a whole table or individual item from the DB
   * @param {string} table Table to load from
   * @param {string|undefined} key Optional database key to load, if undefined whole table will be loaded
   */
  async loadData(table, key) {
    try {
      let db = getDatabase({});
      if (key) {
        // Load specific item
        this.data = await db.table(table).get(key);
      } else {
        // Load entire table
        this.data = [];
        // Use a cursor instead of toArray to prevent IPC max size error
        await db.table(table).each((item) => this.data.push(item));
      }
    } catch {}
  },

  /**
   * Export current database
   * @param {function} progressCallback
   */
  async exportData(progressCallback) {
    try {
      let db = getDatabase({});
      this.data = await exportDB(db, {
        progressCallback,
        numRowsPerChunk: 1,
      });
    } catch {}
  },

  /**
   * Import into current database
   * @param {Blob} data
   * @param {function} progressCallback
   */
  async importData(data, progressCallback) {
    try {
      await importDB(data, { progressCallback });
    } catch {}
  },
};

Comlink.expose(obj);

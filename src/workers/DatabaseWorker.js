import * as Comlink from "comlink";

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
};

Comlink.expose(obj);

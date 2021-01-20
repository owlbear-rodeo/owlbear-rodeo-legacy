import * as Comlink from "comlink";

import { getDatabase } from "../database";

// Worker to load large amounts of database data on a separate thread
let obj = {
  data: [],
  async loadData(table) {
    this.data = [];
    try {
      let db = getDatabase({});
      // Use a cursor instead of toArray to prevent IPC max size error
      await db.table(table).each((map) => this.data.push(map));
    } catch {}
  },
};

Comlink.expose(obj);

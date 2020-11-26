import * as Comlink from "comlink";

import { getDatabase } from "../database";

// Worker to load large amounts of database data on a separate thread
let obj = {
  data: [],
  async loadData(table) {
    let db = getDatabase({});
    this.data = [];
    // Use a cursor instead of toArray to prevent IPC max size error
    await db.table(table).each((map) => this.data.push(map));
  },
};

Comlink.expose(obj);

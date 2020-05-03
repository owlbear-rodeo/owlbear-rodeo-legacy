import Dexie from "dexie";

import blobToBuffer from "./helpers/blobToBuffer";

function loadVersions(db) {
  // v1.2.0
  db.version(1).stores({
    maps: "id, owner",
    states: "mapId",
    tokens: "id, owner",
    user: "key",
  });
  // v1.2.1 - Move from blob files to array buffers
  db.version(2)
    .stores({})
    .upgrade(async (tx) => {
      const maps = await Dexie.waitFor(tx.table("maps").toArray());
      let mapBuffers = {};
      for (let map of maps) {
        mapBuffers[map.id] = await Dexie.waitFor(blobToBuffer(map.file));
      }
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.file = mapBuffers[map.id];
        });
    });
}

// Get the dexie database used in DatabaseContext
export function getDatabase(options) {
  let db = new Dexie("OwlbearRodeoDB", options);
  loadVersions(db);
  return db;
}

import Dexie from "dexie";

import blobToBuffer from "./helpers/blobToBuffer";

function loadVersions(db) {
  db.version(1).stores({
    maps: "id, owner",
    states: "mapId",
    tokens: "id, owner",
    user: "key",
  });
  // Upgrade move from blob files to array buffers
  db.version(2)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          if (map.file instanceof Blob) {
            blobToBuffer(map.file).then((buffer) => {
              map.file = buffer;
            });
          }
        });
    });
}

// Get the dexie database used in DatabaseContext
export function getDatabase(options) {
  let db = new Dexie("OwlbearRodeoDB", options);
  loadVersions(db);
  return db;
}

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
  // v1.3.0 - Added new default tokens
  db.version(3)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
          function mapTokenId(id) {
            switch (id) {
              case "__default-Axes":
                return "__default-barbarian";
              case "__default-Bird":
                return "__default-druid";
              case "__default-Book":
                return "__default-wizard";
              case "__default-Crown":
                return "__default-humanoid";
              case "__default-Dragon":
                return "__default-dragon";
              case "__default-Eye":
                return "__default-warlock";
              case "__default-Fist":
                return "__default-monk";
              case "__default-Horse":
                return "__default-fey";
              case "__default-Leaf":
                return "__default-druid";
              case "__default-Lion":
                return "__default-monstrosity";
              case "__default-Money":
                return "__default-humanoid";
              case "__default-Moon":
                return "__default-cleric";
              case "__default-Potion":
                return "__default-sorcerer";
              case "__default-Shield":
                return "__default-paladin";
              case "__default-Skull":
                return "__default-undead";
              case "__default-Snake":
                return "__default-beast";
              case "__default-Sun":
                return "__default-cleric";
              case "__default-Swords":
                return "__default-fighter";
              case "__default-Tree":
                return "__default-plant";
              case "__default-Triangle":
                return "__default-sorcerer";
              default:
                return "__default-fighter";
            }
          }
          for (let stateId in state.tokens) {
            state.tokens[stateId].tokenId = mapTokenId(
              state.tokens[stateId].tokenId
            );
            state.tokens[stateId].type = "default";
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

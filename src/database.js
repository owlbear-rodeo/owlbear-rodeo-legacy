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
                return "__default-Barbarian";
              case "__default-Bird":
                return "__default-Druid";
              case "__default-Book":
                return "__default-Wizard";
              case "__default-Crown":
                return "__default-Humanoid";
              case "__default-Dragon":
                return "__default-Dragon";
              case "__default-Eye":
                return "__default-Warlock";
              case "__default-Fist":
                return "__default-Monk";
              case "__default-Horse":
                return "__default-Fey";
              case "__default-Leaf":
                return "__default-Druid";
              case "__default-Lion":
                return "__default-Monstrosity";
              case "__default-Money":
                return "__default-Humanoid";
              case "__default-Moon":
                return "__default-Cleric";
              case "__default-Potion":
                return "__default-Sorcerer";
              case "__default-Shield":
                return "__default-Paladin";
              case "__default-Skull":
                return "__default-Undead";
              case "__default-Snake":
                return "__default-Beast";
              case "__default-Sun":
                return "__default-Cleric";
              case "__default-Swords":
                return "__default-Fighter";
              case "__default-Tree":
                return "__default-Plant";
              case "__default-Triangle":
                return "__default-Sorcerer";
              default:
                return "__default-Fighter";
            }
          }
          for (let stateId in state.tokens) {
            state.tokens[stateId].tokenId = mapTokenId(
              state.tokens[stateId].tokenId
            );
            state.tokens[stateId].lastEditedBy = "";
            state.tokens[stateId].rotation = 0;
          }
        });
    });
  // v1.3.1 - Added show grid option
  db.version(4)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.showGrid = false;
        });
    });
  // v1.4.0 - Added fog subtraction
  db.version(5)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
          for (let fogAction of state.fogDrawActions) {
            if (fogAction.type === "add" || fogAction.type === "edit") {
              for (let shape of fogAction.shapes) {
                shape.data.holes = [];
              }
            }
          }
        });
    });
  // v1.4.2 - Added map resolutions
  db.version(6)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.resolutions = {};
          map.quality = "original";
        });
    });
  // v1.5.0 - Fixed default token rogue spelling
  db.version(7)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
          for (let id in state.tokens) {
            if (state.tokens[id].tokenId === "__default-Rouge") {
              state.tokens[id].tokenId = "__default-Rogue";
            }
          }
        });
    });
  // v1.5.0 - Added map snap to grid option
  db.version(8)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.snapToGrid = true;
        });
    });
  // v1.5.1 - Added lock, visibility and modified to tokens
  db.version(9)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
          for (let id in state.tokens) {
            state.tokens[id].lastModifiedBy = state.tokens[id].lastEditedBy;
            delete state.tokens[id].lastEditedBy;
            state.tokens[id].lastModified = Date.now();
            state.tokens[id].locked = false;
            state.tokens[id].visible = true;
          }
        });
    });
  // v1.5.1 - Added token prop category and remove isVehicle bool
  db.version(10)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("tokens")
        .toCollection()
        .modify((token) => {
          token.category = token.isVehicle ? "vehicle" : "character";
          delete token.isVehicle;
        });
    });
  // v1.5.2 - Added automatic cache invalidation to maps
  db.version(11)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.lastUsed = map.lastModified;
        });
    });
  // v1.5.2 - Added automatic cache invalidation to tokens
  db.version(12)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("tokens")
        .toCollection()
        .modify((token) => {
          token.lastUsed = token.lastModified;
        });
    });
  // v1.6.0 - Added map grouping and grid scale and offset
  db.version(13)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.group = "";
          map.grid = {
            size: { x: map.gridX, y: map.gridY },
            inset: { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: 1 } },
            type: "square",
          };
          delete map.gridX;
          delete map.gridY;
          delete map.gridType;
        });
    });
  // v1.6.0 - Added token grouping
  db.version(14)
    .stores({})
    .upgrade((tx) => {
      return tx
        .table("tokens")
        .toCollection()
        .modify((token) => {
          token.group = "";
        });
    });
}

// Get the dexie database used in DatabaseContext
export function getDatabase(options) {
  let db = new Dexie("OwlbearRodeoDB", options);
  loadVersions(db);
  return db;
}

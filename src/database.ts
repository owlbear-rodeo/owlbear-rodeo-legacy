// eslint-disable-next-line no-unused-vars
import Dexie, { Version, DexieOptions, Transaction } from "dexie";
import "dexie-observable";
import shortid from "shortid";

import blobToBuffer from "./helpers/blobToBuffer";
import { getGridDefaultInset, Grid } from "./helpers/grid";
import { convertOldActionsToShapes } from "./actions";
import { createThumbnail } from "./helpers/image";

// Helper to create a thumbnail for a file in a db
async function createDataThumbnail(data: any) {
  let url: string;
  if (data?.resolutions?.low?.file) {
    url = URL.createObjectURL(new Blob([data.resolutions.low.file]));
  } else {
    url = URL.createObjectURL(new Blob([data.file]));
  }
  return await Dexie.waitFor(
    new Promise((resolve) => {
      let image = new Image();
      image.onload = async () => {
        // TODO: confirm parameter for type here
        const thumbnail = await createThumbnail(image, "file");
        resolve(thumbnail);
      };
      image.src = url;
    }),
    60000 * 10 // 10 minute timeout
  );
}

/**
 * @callback VersionCallback
 * @param {Version} version
 */

type VersionCallback = (version: Version) => void

/**
 * Mapping of version number to their upgrade function
 * @type {Object.<number, VersionCallback>}
 */

const versions: Record<number, VersionCallback> = {
  // v1.2.0
  1(v: Version) {
    v.stores({
      maps: "id, owner",
      states: "mapId",
      tokens: "id, owner",
      user: "key",
    });
  },
  // v1.2.1 - Move from blob files to array buffers
  2(v: Version) {
    v.stores({}).upgrade(async (tx: Transaction) => {
      const maps = await Dexie.waitFor(tx.table("maps").toArray());
      let mapBuffers: any = {};
      for (let map of maps) {
        mapBuffers[map.id] = await Dexie.waitFor(blobToBuffer(map.file));
      }
      return tx
        .table("maps")
        .toCollection()
        .modify((map: any) => {
          map.file = mapBuffers[map.id];
        });
    });
  },
  // v1.3.0 - Added new default tokens
  3(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state: any) => {
          function mapTokenId(id: any) {
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
  },
  // v1.3.1 - Added show grid option
  4(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map: any) => {
          map.showGrid = false;
        });
    });
  },
  // v1.4.0 - Added fog subtraction
  5(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state: any) => {
          for (let fogAction of state.fogDrawActions) {
            if (fogAction.type === "add" || fogAction.type === "edit") {
              for (let shape of fogAction.shapes) {
                shape.data.holes = [];
              }
            }
          }
        });
    });
  },
  // v1.4.2 - Added map resolutions
  6(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map: any) => {
          map.resolutions = {};
          map.quality = "original";
        });
    });
  },
  // v1.5.0 - Fixed default token rogue spelling
  7(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state: any) => {
          for (let id in state.tokens) {
            if (state.tokens[id].tokenId === "__default-Rouge") {
              state.tokens[id].tokenId = "__default-Rogue";
            }
          }
        });
    });
  },
  // v1.5.0 - Added map snap to grid option
  8(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map: any) => {
          map.snapToGrid = true;
        });
    });
  },
  // v1.5.1 - Added lock, visibility and modified to tokens
  9(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state: any) => {
          for (let id in state.tokens) {
            state.tokens[id].lastModifiedBy = state.tokens[id].lastEditedBy;
            delete state.tokens[id].lastEditedBy;
            state.tokens[id].lastModified = Date.now();
            state.tokens[id].locked = false;
            state.tokens[id].visible = true;
          }
        });
    });
  },
  // v1.5.1 - Added token prop category and remove isVehicle bool
  10(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("tokens")
        .toCollection()
        .modify((token: any) => {
          token.category = token.isVehicle ? "vehicle" : "character";
          delete token.isVehicle;
        });
    });
  },
  // v1.5.2 - Added automatic cache invalidation to maps
  11(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map: any) => {
          map.lastUsed = map.lastModified;
        });
    });
  },
  // v1.5.2 - Added automatic cache invalidation to tokens
  12(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("tokens")
        .toCollection()
        .modify((token: any) => {
          token.lastUsed = token.lastModified;
        });
    });
  },
  // v1.6.0 - Added map grouping and grid scale and offset
  13(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("maps")
        .toCollection()
        .modify((map: any) => {
          map.group = "";
          map.grid = {
            size: { x: map.gridX, y: map.gridY },
            inset: getGridDefaultInset(
              { size: { x: map.gridX, y: map.gridY }, type: "square" } as Grid,
              map.width,
              map.height
            ),
            type: "square",
          };
          delete map.gridX;
          delete map.gridY;
          delete map.gridType;
        });
    });
  },
  // v1.6.0 - Added token grouping
  14(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("tokens")
        .toCollection()
        .modify((token: any) => {
          token.group = "";
        });
    });
  },
  // v1.6.1 - Added width and height to tokens
  15(v: Version) {
    v.stores({}).upgrade(async (tx: Transaction) => {
      const tokens = await Dexie.waitFor(tx.table("tokens").toArray());
      let tokenSizes: any = {};
      for (let token of tokens) {
        const url = URL.createObjectURL(new Blob([token.file]));
        let image = new Image();
        tokenSizes[token.id] = await Dexie.waitFor(
          new Promise((resolve) => {
            image.onload = () => {
              resolve({ width: image.width, height: image.height });
            };
            image.src = url;
          })
        );
      }
      return tx
        .table("tokens")
        .toCollection()
        .modify((token: any) => {
          token.width = tokenSizes[token.id].width;
          token.height = tokenSizes[token.id].height;
        });
    });
  },
  // v1.7.0 - Added note tool
  16(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state: any) => {
          state.notes = {};
          state.editFlags = [...state.editFlags, "notes"];
        });
    });
  },
  // 1.7.0 (hotfix) - Optimized fog shape edits to only include needed data
  17(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state: any) => {
          for (let i = 0; i < state.fogDrawActions.length; i++) {
            const action = state.fogDrawActions[i];
            if (action && action.type === "edit") {
              for (let j = 0; j < action.shapes.length; j++) {
                const shape = action.shapes[j];
                const temp = { ...shape };
                state.fogDrawActions[i].shapes[j] = {
                  id: temp.id,
                  visible: temp.visible,
                };
              }
            }
          }
        });
    });
  },
  // 1.8.0 - Added note text only mode, converted draw and fog representations
  18(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state: any) => {
          for (let id in state.notes) {
            state.notes[id].textOnly = false;
          }

          state.drawShapes = convertOldActionsToShapes(
            state.mapDrawActions,
            state.mapDrawActionIndex
          );
          state.fogShapes = convertOldActionsToShapes(
            state.fogDrawActions,
            state.fogDrawActionIndex
          );

          delete state.mapDrawActions;
          delete state.mapDrawActionIndex;
          delete state.fogDrawActions;
          delete state.fogDrawActionIndex;
        });
    });
  },
  // 1.8.0 - Add thumbnail to maps and add measurement to grid
  19(v: Version) {
    v.stores({}).upgrade(async (tx: Transaction) => {
      const userId = (await Dexie.waitFor(tx.table("user").get("userId")))
        .value;
      const maps = await Dexie.waitFor(tx.table("maps").toArray());
      const thumbnails: any = {};
      for (let map of maps) {
        try {
          if (map.owner === userId) {
            thumbnails[map.id] = await createDataThumbnail(map);
          }
        } catch {}
      }
      return tx
        .table("maps")
        .toCollection()
        .modify((map: any) => {
          map.thumbnail = thumbnails[map.id];
          map.grid.measurement = { type: "chebyshev", scale: "5ft" };
        });
    });
  },
  // 1.8.0 - Add thumbnail to tokens
  20(v: Version) {
    v.stores({}).upgrade(async (tx: Transaction) => {
      const userId = (await Dexie.waitFor(tx.table("user").get("userId")))
        .value;
      const tokens = await Dexie.waitFor(tx.table("tokens").toArray());
      const thumbnails: any = {};
      for (let token of tokens) {
        try {
          if (token.owner === userId) {
            thumbnails[token.id] = await createDataThumbnail(token);
          }
        } catch {}
      }
      return tx
        .table("tokens")
        .toCollection()
        .modify((token: any) => {
          token.thumbnail = thumbnails[token.id];
        });
    });
  },
  // 1.8.0 - Upgrade for Dexie.Observable
  21(v: Version) {
    v.stores({});
  },
  // v1.8.1 - Shorten fog shape ids
  22(v: Version) {
    v.stores({}).upgrade((tx: Transaction) => {
      return tx
        .table("states")
        .toCollection()
        .modify((state: any) => {
          for (let id of Object.keys(state.fogShapes)) {
            const newId = shortid.generate();
            state.fogShapes[newId] = state.fogShapes[id];
            state.fogShapes[newId].id = newId;
            delete state.fogShapes[id];
          }
        });
    });
  },
};

const latestVersion = 22;

/**
 * Load versions onto a database up to a specific version number
 * @param {Dexie} db
 * @param {number=} upTo version number to load up to, latest version if undefined
 */
export function loadVersions(db: Dexie, upTo = latestVersion) {
  for (let versionNumber = 1; versionNumber <= upTo; versionNumber++) {
    versions[versionNumber](db.version(versionNumber));
  }
}

/**
 * Get a Dexie database with a name and versions applied
 * @param {DexieOptions} options
 * @param {string=} name
 * @param {number=} versionNumber
 * @returns {Dexie}
 */
export function getDatabase(
  options: DexieOptions,
  name = "OwlbearRodeoDB",
  versionNumber = latestVersion
) {
  let db = new Dexie(name, options);
  loadVersions(db, versionNumber);
  return db;
}

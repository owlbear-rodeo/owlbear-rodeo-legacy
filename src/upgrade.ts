// eslint-disable-next-line no-unused-vars
import Dexie, { Version } from "dexie";
import shortid from "shortid";
import { v4 as uuid } from "uuid";
import Case from "case";
import chunk from "lodash.chunk";

import blobToBuffer from "./helpers/blobToBuffer";
import { getGridDefaultInset } from "./helpers/grid";
import { createThumbnail, getImageOutline } from "./helpers/image";
import {
  AddStatesAction,
  EditStatesAction,
  RemoveStatesAction,
  SubtractFogAction,
  CutFogAction,
} from "./actions";
import { getDefaultMaps } from "./maps";
import { getDefaultTokens } from "./tokens";
import { Outline } from "./types/Outline";
import { Group, GroupContainer } from "./types/Group";
import cloneDeep from "lodash.clonedeep";

export type UpgradeEventHandler = (versionNumber: number) => void;

type VersionCallback = (
  version: Version,
  onUpgrade?: UpgradeEventHandler
) => void;

/**
 * Mapping of version number to their upgrade function
 */
export const versions: Record<number, VersionCallback> = {
  // v1.2.0
  1(v) {
    v.stores({
      maps: "id, owner",
      states: "mapId",
      tokens: "id, owner",
      user: "key",
    });
  },
  // v1.2.1 - Move from blob files to array buffers
  2(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(2);
      const maps = await Dexie.waitFor(tx.table("maps").toArray());
      let mapBuffers: Record<string, ArrayBuffer> = {};
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
  },
  // v1.3.0 - Added new default tokens
  3(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(3);
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
          function mapTokenId(id: string) {
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
  4(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(4);
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.showGrid = false;
        });
    });
  },
  // v1.4.0 - Added fog subtraction
  5(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(5);
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
  },
  // v1.4.2 - Added map resolutions
  6(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(6);
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.resolutions = {};
          map.quality = "original";
        });
    });
  },
  // v1.5.0 - Fixed default token rogue spelling
  7(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(7);
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
  },
  // v1.5.0 - Added map snap to grid option
  8(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(8);
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.snapToGrid = true;
        });
    });
  },
  // v1.5.1 - Added lock, visibility and modified to tokens
  9(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(9);
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
  },
  // v1.5.1 - Added token prop category and remove isVehicle bool
  10(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(10);
      return tx
        .table("tokens")
        .toCollection()
        .modify((token) => {
          token.category = token.isVehicle ? "vehicle" : "character";
          delete token.isVehicle;
        });
    });
  },
  // v1.5.2 - Added automatic cache invalidation to maps
  11(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(11);
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.lastUsed = map.lastModified;
        });
    });
  },
  // v1.5.2 - Added automatic cache invalidation to tokens
  12(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(12);
      return tx
        .table("tokens")
        .toCollection()
        .modify((token) => {
          token.lastUsed = token.lastModified;
        });
    });
  },
  // v1.6.0 - Added map grouping and grid scale and offset
  13(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(13);
      return tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          map.group = "";
          map.grid = {
            size: { x: map.gridX, y: map.gridY },
            inset: getGridDefaultInset(
              { size: { x: map.gridX, y: map.gridY }, type: "square" },
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
  14(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(14);
      return tx
        .table("tokens")
        .toCollection()
        .modify((token) => {
          token.group = "";
        });
    });
  },
  // v1.6.1 - Added width and height to tokens
  15(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(15);
      const tokens = await Dexie.waitFor(tx.table("tokens").toArray());
      let tokenSizes: Record<string, { width: number; height: number }> = {};
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
        .modify((token) => {
          token.width = tokenSizes[token.id].width;
          token.height = tokenSizes[token.id].height;
        });
    });
  },
  // v1.7.0 - Added note tool
  16(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(16);
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
          state.notes = {};
          state.editFlags = [...state.editFlags, "notes"];
        });
    });
  },
  // 1.7.0 (hotfix) - Optimized fog shape edits to only include needed data
  17(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(17);
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
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
  18(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(18);
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
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
  19(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(19);
      const userId = (await Dexie.waitFor(tx.table("user").get("userId")))
        .value;
      const maps = await Dexie.waitFor(tx.table("maps").toArray());
      const thumbnails: Record<string, any> = {};
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
        .modify((map) => {
          map.thumbnail = thumbnails[map.id];
          map.grid.measurement = { type: "chebyshev", scale: "5ft" };
        });
    });
  },
  // 1.8.0 - Add thumbnail to tokens
  20(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(20);
      const userId = (await Dexie.waitFor(tx.table("user").get("userId")))
        .value;
      const tokens = await Dexie.waitFor(tx.table("tokens").toArray());
      const thumbnails: Record<string, any> = {};
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
        .modify((token) => {
          token.thumbnail = thumbnails[token.id];
        });
    });
  },
  // 1.8.0 - Upgrade for Dexie.Observable
  21(v) {
    v.stores({});
  },
  // v1.8.1 - Shorten fog shape ids
  22(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(22);
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
          for (let id of Object.keys(state.fogShapes)) {
            const newId = shortid.generate();
            state.fogShapes[newId] = state.fogShapes[id];
            state.fogShapes[newId].id = newId;
            delete state.fogShapes[id];
          }
        });
    });
  },
  // v1.9.0 - Add outlines to tokens
  23(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(23);
      const tokens = await Dexie.waitFor(tx.table("tokens").toArray());
      const tokenOutlines = await Dexie.waitFor(
        Promise.all(tokens.map(createDataOutline))
      );

      return tx
        .table("tokens")
        .toCollection()
        .modify((token) => {
          const tokenOutline = tokenOutlines.find((el) => el.id === token.id);
          if (tokenOutline) {
            token.outline = tokenOutline.outline;
          } else {
            token.outline = {
              type: "rect",
              width: token.width,
              height: token.height,
              x: 0,
              y: 0,
            };
          }
        });
    });
  },
  // v1.9.0 - Move map assets into new table
  24(v, onUpgrade) {
    v.stores({ assets: "id, owner" }).upgrade(async (tx) => {
      onUpgrade?.(24);

      const primaryKeys = await Dexie.waitFor(
        tx.table("maps").toCollection().primaryKeys()
      );
      const keyChunks = chunk(primaryKeys, 4);

      for (let keys of keyChunks) {
        let assets = [];
        let maps = await Dexie.waitFor(tx.table("maps").bulkGet(keys));
        while (maps.length > 0) {
          const map = maps.pop();
          assets.push({
            id: uuid(),
            owner: map.owner,
            file: map.file,
            width: map.width,
            height: map.height,
            mime: "",
            prevId: map.id,
            prevType: "map",
          });

          for (let resolution in map.resolutions) {
            const mapRes = map.resolutions[resolution];
            assets.push({
              id: uuid(),
              owner: map.owner,
              file: mapRes.file,
              width: mapRes.width,
              height: mapRes.height,
              mime: "",
              prevId: map.id,
              prevType: "mapResolution",
              resolution,
            });
          }
          if (map.thumbnail) {
            assets.push({
              id: uuid(),
              owner: map.owner,
              file: map.thumbnail.file,
              width: map.thumbnail.width,
              height: map.thumbnail.height,
              mime: "",
              prevId: map.id,
              prevType: "mapThumbnail",
            });
          }
        }
        await tx.table("assets").bulkAdd(assets);
      }
    });
  },
  // v1.9.0 - Move token assets into new table
  25(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(25);

      const primaryKeys = await Dexie.waitFor(
        tx.table("tokens").toCollection().primaryKeys()
      );
      const keyChunks = chunk(primaryKeys, 4);

      for (let keys of keyChunks) {
        let assets = [];
        let tokens = await Dexie.waitFor(tx.table("tokens").bulkGet(keys));
        while (tokens.length > 0) {
          let token = tokens.pop();
          assets.push({
            id: uuid(),
            owner: token.owner,
            file: token.file,
            width: token.width,
            height: token.height,
            mime: "",
            prevId: token.id,
            prevType: "token",
          });
          if (token.thumbnail) {
            assets.push({
              id: uuid(),
              owner: token.owner,
              file: token.thumbnail.file,
              width: token.thumbnail.width,
              height: token.thumbnail.height,
              mime: "",
              prevId: token.id,
              prevType: "tokenThumbnail",
            });
          }
        }
        await tx.table("assets").bulkAdd(assets);
      }
    });
  },
  // v1.9.0 - Create foreign keys for assets
  26(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(26);

      let mapUpdates: Record<string, any> = {};
      let tokenUpdates: Record<string, any> = {};

      const primaryKeys = await Dexie.waitFor(
        tx.table("assets").toCollection().primaryKeys()
      );
      const keyChunks = chunk(primaryKeys, 4);

      for (let keys of keyChunks) {
        let assets = await Dexie.waitFor(tx.table("assets").bulkGet(keys));
        while (assets.length > 0) {
          const asset = assets.pop();
          const { prevId, id, prevType, resolution } = asset;
          if (prevType === "token" || prevType === "tokenThumbnail") {
            if (!(prevId in tokenUpdates)) {
              tokenUpdates[prevId] = {};
            }
          } else {
            if (!(prevId in mapUpdates)) {
              mapUpdates[prevId] = {};
            }
          }

          if (prevType === "map") {
            mapUpdates[prevId].file = id;
          } else if (prevType === "token") {
            tokenUpdates[prevId].file = id;
          } else if (prevType === "mapThumbnail") {
            mapUpdates[prevId].thumbnail = id;
          } else if (prevType === "tokenThumbnail") {
            tokenUpdates[prevId].thumbnail = id;
          } else if (prevType === "mapResolution") {
            mapUpdates[prevId][resolution] = id;
          }
        }
      }

      await tx
        .table("maps")
        .toCollection()
        .modify((map) => {
          if (map.id in mapUpdates) {
            for (let key in mapUpdates[map.id]) {
              map[key] = mapUpdates[map.id][key];
            }
          }
          delete map.resolutions;
        });
      await tx
        .table("tokens")
        .toCollection()
        .modify((token) => {
          if (token.id in tokenUpdates) {
            for (let key in tokenUpdates[token.id]) {
              token[key] = tokenUpdates[token.id][key];
            }
          }
        });
    });
  },
  // v1.9.0 - Remove asset migration helpers
  27(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(27);
      tx.table("assets").toCollection().modify({
        prevId: undefined,
        prevType: undefined,
        resolution: undefined,
      });
    });
  },
  // v1.9.0 - Remap map resolution assets
  28(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(28);
      tx.table("maps")
        .toCollection()
        .modify((map) => {
          const resolutions = ["low", "medium", "high", "ultra"];
          map.resolutions = {};
          for (let res of resolutions) {
            if (res in map) {
              map.resolutions[res] = map[res];
              delete map[res];
            }
          }
          delete map.lastUsed;
        });
    });
  },
  // v1.9.0 - Move tokens to use more defaults
  29(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(29);
      tx.table("tokens")
        .toCollection()
        .modify(async (token) => {
          token.defaultCategory = token.category;
          delete token.category;
          token.defaultLabel = "";
          delete token.lastUsed;
        });
    });
  },
  // v1.9.0 - Move tokens to use more defaults and add token outline to token states
  30(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(30);
      const tokens = await Dexie.waitFor(tx.table("tokens").toArray());
      tx.table("states")
        .toCollection()
        .modify((state) => {
          for (let id in state.tokens) {
            if (!state.tokens[id]?.tokenId) {
              delete state.tokens[id];
              continue;
            }
            if (!state.tokens[id].tokenId.startsWith("__default")) {
              const token = tokens.find(
                (token) => token.id === state.tokens[id].tokenId
              );
              if (token) {
                state.tokens[id].category = token.defaultCategory;
                state.tokens[id].file = token.file;
                state.tokens[id].type = "file";
                state.tokens[id].outline = token.outline;
                state.tokens[id].width = token.width;
                state.tokens[id].height = token.height;
                state.tokens[id].owner = token.owner;
              } else {
                state.tokens[id].category = "character";
                state.tokens[id].type = "file";
                state.tokens[id].file = "";
                state.tokens[id].outline = {
                  type: "rect",
                  width: 256,
                  height: 256,
                  x: 0,
                  y: 0,
                };
                state.tokens[id].width = 256;
                state.tokens[id].height = 256;
              }
            } else {
              state.tokens[id].category = "character";
              state.tokens[id].type = "default";
              state.tokens[id].key = Case.camel(
                state.tokens[id].tokenId.slice(10)
              );
              state.tokens[id].outline = {
                type: "circle",
                x: 128,
                y: 128,
                radius: 128,
              };
              state.tokens[id].width = 256;
              state.tokens[id].height = 256;
            }
          }
        });
    });
  },
  // v1.9.0 - Remove maps not owned by user as cache is now done on the asset level
  31(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(31);
      const userId = (await Dexie.waitFor(tx.table("user").get("userId")))
        ?.value;
      if (userId) {
        tx.table("maps").where("owner").notEqual(userId).delete();
      }
    });
  },
  // v1.9.0 - Remove tokens not owned by user as cache is now done on the asset level
  32(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(32);
      const userId = (await Dexie.waitFor(tx.table("user").get("userId")))
        ?.value;
      if (userId) {
        tx.table("tokens").where("owner").notEqual(userId).delete();
      }
    });
  },
  // v1.9.0 - Store default maps and tokens in db
  33(v, onUpgrade) {
    v.stores({}).upgrade(async (tx) => {
      onUpgrade?.(33);
      const userId = (await Dexie.waitFor(tx.table("user").get("userId")))
        ?.value;
      if (!userId) {
        return;
      }
      const { maps } = getDefaultMaps(userId);
      tx.table("maps").bulkAdd(maps);
      const tokens = getDefaultTokens(userId);
      tx.table("tokens").bulkAdd(tokens);
    });
  },
  // v1.9.0 - Add new group table
  34(v, onUpgrade) {
    v.stores({ groups: "id" }).upgrade(async (tx) => {
      onUpgrade?.(34);
      function groupItems(items: { id: string; group: string }[]) {
        let groups: Group[] = [];
        let subGroups: Record<string, GroupContainer> = {};
        for (let item of items) {
          if (!item.group) {
            groups.push({ id: item.id, type: "item" });
          } else if (item.group in subGroups) {
            subGroups[item.group].items.push({ id: item.id, type: "item" });
          } else {
            subGroups[item.group] = {
              id: uuid(),
              type: "group",
              name: item.group,
              items: [{ id: item.id, type: "item" }],
            };
          }
        }
        groups.push(...Object.values(subGroups));
        return groups;
      }

      let maps = await Dexie.waitFor(tx.table("maps").toArray());
      maps = maps.sort((a, b) => b.created - a.created);
      const mapGroupItems = groupItems(maps);
      tx.table("groups").add({ id: "maps", items: mapGroupItems });

      let tokens = await Dexie.waitFor(tx.table("tokens").toArray());
      tokens = tokens.sort((a, b) => b.created - a.created);
      const tokenGroupItems = groupItems(tokens);
      tx.table("groups").add({ id: "tokens", items: tokenGroupItems });
    });
  },
  // v1.9.0 - Remove map and token group in respective tables
  35(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(35);
      tx.table("maps")
        .toCollection()
        .modify((map) => {
          delete map.group;
        });
      tx.table("tokens")
        .toCollection()
        .modify((token) => {
          delete token.group;
        });
    });
  },
  36(v) {
    v.stores({
      _changes: null,
      _intercomm: null,
      _syncNodes: null,
      _uncommittedChanges: null,
    });
  },
  // v1.10.0 - Add rotation to notes
  37(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(37);
      tx.table("states")
        .toCollection()
        .modify((state) => {
          for (let id in state.notes) {
            state.notes[id].rotation = 0;
          }
        });
    });
  },
  // v1.10.0 - Delete groups again
  38(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(38);
      tx.table("maps")
        .toCollection()
        .modify((map) => {
          delete map.group;
        });
      tx.table("tokens")
        .toCollection()
        .modify((token) => {
          delete token.group;
        });
    });
  },
  // v1.10.0 - Rename drawShapes and fogShapes in state
  39(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(39);
      tx.table("states")
        .toCollection()
        .modify((state) => {
          state.drawings = state.drawShapes;
          state.fogs = state.fogShapes;

          delete state.drawShapes;
          delete state.fogShapes;
        });
    });
  },
  // v1.10.0 (patch 1) - Rename drawShapes and fogShapes in state again (some people's didn't work)
  40(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(40);
      tx.table("states")
        .toCollection()
        .modify((state) => {
          if (state.drawShapes) {
            state.drawings = cloneDeep(state.drawShapes);
            delete state.drawShapes;
          }
          if (state.fogShapes) {
            state.fogs = cloneDeep(state.fogShapes);
            delete state.fogShapes;
          }
        });
    });
  },
  // v1.10.0 (patch 2) - Rename drawShapes and fogShapes in state again again (some people's still didn't work)
  41(v, onUpgrade) {
    v.stores({}).upgrade((tx) => {
      onUpgrade?.(41);
      return tx
        .table("states")
        .toCollection()
        .modify((state) => {
          if (state.drawShapes) {
            state.drawings = cloneDeep(state.drawShapes);
            delete state.drawShapes;
          }
          if (state.fogShapes) {
            state.fogs = cloneDeep(state.fogShapes);
            delete state.fogShapes;
          }
        });
    });
  },
};

export const latestVersion = 41;

/**
 * Load versions onto a database up to a specific version number
 * @param {Dexie} db
 * @param {number=} upTo version number to load up to, latest version if undefined
 * @param {UpgradeEventHandler=} onUpgrade
 */
export function loadVersions(
  db: Dexie,
  upTo: number | undefined = latestVersion,
  onUpgrade: UpgradeEventHandler | undefined
) {
  for (let versionNumber = 1; versionNumber <= upTo; versionNumber++) {
    versions[versionNumber](db.version(versionNumber), onUpgrade);
  }
}

/**
 * Convert from the previous representation of actions (1.7.0) to the new representation (1.8.0)
 * and combine into shapes
 */
function convertOldActionsToShapes(actions: any[], actionIndex: number) {
  let newShapes = {};
  for (let i = 0; i <= actionIndex; i++) {
    const action = actions[i];
    if (!action) {
      continue;
    }
    let newAction;
    if (action.shapes) {
      if (action.type === "add") {
        newAction = new AddStatesAction(action.shapes);
      } else if (action.type === "edit") {
        newAction = new EditStatesAction(action.shapes);
      } else if (action.type === "remove") {
        newAction = new RemoveStatesAction(action.shapes);
      } else if (action.type === "subtract") {
        newAction = new SubtractFogAction(action.shapes);
      } else if (action.type === "cut") {
        newAction = new CutFogAction(action.shapes);
      }
    } else if (action.type === "remove" && action.shapeIds) {
      newAction = new RemoveStatesAction(action.shapeIds);
    }

    if (newAction) {
      newShapes = newAction.execute(newShapes);
    }
  }
  return newShapes;
}

// Helper to create a thumbnail for a file in a db
async function createDataThumbnail(data: any): Promise<{
  file: Uint8Array;
  width: number;
  height: number;
  type: "file";
  id: "thumbnail";
}> {
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
        const thumbnail = await createThumbnail(image, "");
        if (thumbnail) {
          resolve({
            file: thumbnail.file,
            width: thumbnail.width,
            height: thumbnail.height,
            type: "file",
            id: "thumbnail",
          });
        }
      };
      image.src = url;
    }),
    60000 * 10 // 10 minute timeout
  );
}

async function createDataOutline(
  data: any
): Promise<{ id: string; outline: Outline }> {
  const url = URL.createObjectURL(new Blob([data.file]));
  return await Dexie.waitFor(
    new Promise((resolve) => {
      let image = new Image();
      image.onload = async () => {
        resolve({ id: data.id, outline: getImageOutline(image) });
      };
      image.onerror = () => {
        resolve({
          id: data.id,
          outline: {
            type: "rect",
            width: data.width,
            height: data.height,
            x: 0,
            y: 0,
          },
        });
      };
      image.src = url;
    })
  );
}

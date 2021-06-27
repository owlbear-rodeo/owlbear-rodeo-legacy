import * as Comlink from "comlink";
import {
  importInto,
  exportDB,
  peakImportFile,
} from "@mitchemmc/dexie-export-import";
import { encode, decode } from "@msgpack/msgpack";

import { getDatabase } from "../database";
import blobToBuffer from "../helpers/blobToBuffer";

// Worker to load large amounts of database data on a separate thread
let service = {
  /**
   * Load either a whole table or individual item from the DB
   * @param {string} table Table to load from
   * @param {string=} key Optional database key to load, if undefined whole table will be loaded
   */
  async loadData(table, key) {
    try {
      let db = getDatabase({});
      if (key) {
        // Load specific item
        const data = await db.table(table).get(key);
        const packed = encode(data);
        return Comlink.transfer(packed, [packed.buffer]);
      } else {
        // Load entire table
        let items = [];
        // Use a cursor instead of toArray to prevent IPC max size error
        await db.table(table).each((item) => {
          items.push(item);
        });

        // Pack data with msgpack so we can use transfer to avoid memory issues
        const packed = encode(items);
        return Comlink.transfer(packed, [packed.buffer]);
      }
    } catch {}
  },

  /**
   * Put data into table encoded by msgpack
   * @param {Uint8Array} data
   * @param {string} table
   */
  async putData(data, table) {
    try {
      let db = getDatabase({});
      const decoded = decode(data);
      await db.table(table).put(decoded);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Export current database
   * @param {function} progressCallback
   * @param {string[]} mapIds An array of map ids to export
   * @param {string[]} tokenIds An array of token ids to export
   */
  async exportData(progressCallback, mapIds, tokenIds) {
    let db = getDatabase({});

    // Add assets for selected maps and tokens
    const maps = await db.table("maps").where("id").anyOf(mapIds).toArray();
    const tokens = await db
      .table("tokens")
      .where("id")
      .anyOf(tokenIds)
      .toArray();
    const assetIds = [];
    for (let map of maps) {
      if (map.type === "file") {
        assetIds.push(map.file);
        assetIds.push(map.thumbnail);
        for (let res of Object.values(map.resolutions)) {
          assetIds.push(res);
        }
      }
    }
    for (let token of tokens) {
      if (token.type === "file") {
        assetIds.push(token.file);
        assetIds.push(token.thumbnail);
      }
    }

    const filter = (table, value) => {
      if (table === "maps") {
        return mapIds.includes(value.id);
      }
      if (table === "states") {
        return mapIds.includes(value.mapId);
      }
      if (table === "tokens") {
        return tokenIds.includes(value.id);
      }
      if (table === "assets") {
        return assetIds.includes(value.id);
      }
      // Always include groups table
      if (table === "groups") {
        return true;
      }

      return false;
    };

    const data = await exportDB(db, {
      progressCallback,
      filter,
      numRowsPerChunk: 1,
      prettyJson: true,
    });

    const buffer = await blobToBuffer(data);

    return Comlink.transfer(buffer, [buffer.buffer]);
  },

  /**
   * Import into current database
   * @param {Blob} data
   * @param {string} databaseName The name of the database to import into
   * @param {function} progressCallback
   */
  async importData(data, databaseName, progressCallback) {
    const importMeta = await peakImportFile(data);
    if (!importMeta.data) {
      throw new Error("Uanble to parse file");
    }

    let db = getDatabase({});

    if (importMeta.data.databaseName !== db.name) {
      throw new Error("Unable to import database, name mismatch");
    }
    if (importMeta.data.databaseVersion > db.verno) {
      throw new Error(
        `Database version differs. Current database is in version ${db.verno} but export is ${importMeta.data.databaseVersion}`
      );
    }

    // Ensure import DB is cleared before importing new data
    let importDB = getDatabase({ addons: [] }, databaseName, 0);
    await importDB.delete();
    importDB.close();

    // Load import database up to it's desired version
    importDB = getDatabase(
      { addons: [] },
      databaseName,
      importMeta.data.databaseVersion,
      false
    );
    await importInto(importDB, data, {
      progressCallback,
      acceptNameDiff: true,
      overwriteValues: true,
      filter: (table, value) => {
        // Ensure values are of the correct form
        if (table === "maps" || table === "tokens") {
          return "id" in value && "owner" in value;
        }
        if (table === "states") {
          return "mapId" in value;
        }
        return true;
      },
      acceptVersionDiff: true,
    });
    importDB.close();
  },

  /**
   * Ensure the asset cache doesn't go over `maxCacheSize` by removing cached assets
   * Removes largest assets first
   * @param {number} maxCacheSize Max size of cache in bytes
   */
  async cleanAssetCache(maxCacheSize) {
    try {
      let db = getDatabase({});
      const userId = (await db.table("user").get("userId")).value;
      const cachedAssets = await db
        .table("assets")
        .where("owner")
        .notEqual(userId)
        .toArray();
      const totalSize = cachedAssets.reduce(
        (acc, cur) => acc + cur.file.byteLength,
        0
      );
      if (totalSize > maxCacheSize) {
        // Remove largest assets first
        const largestAssets = cachedAssets.sort(
          (a, b) => b.file.byteLength - a.file.byteLength
        );
        let assetsToDelete = [];
        let deletedBytes = 0;
        for (let asset of largestAssets) {
          assetsToDelete.push(asset.id);
          deletedBytes += asset.file.byteLength;
          if (totalSize - deletedBytes < maxCacheSize) {
            break;
          }
        }
        await db.table("assets").bulkDelete(assetsToDelete);
      }
    } catch {}
  },
};

Comlink.expose(service);

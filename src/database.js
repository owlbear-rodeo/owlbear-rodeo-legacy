// eslint-disable-next-line no-unused-vars
import Dexie, { DexieOptions } from "dexie";
import { v4 as uuid } from "uuid";
import "dexie-observable";

import { loadVersions, latestVersion } from "./upgrade";
import { getDefaultMaps } from "./maps";
import { getDefaultTokens } from "./tokens";

/**
 * Populate DB with initial data
 * @param {Dexie} db
 */
function populate(db) {
  db.on("populate", () => {
    const userId = uuid();
    db.table("user").add({ key: "userId", value: userId });
    const { maps, mapStates } = getDefaultMaps(userId);
    db.table("maps").bulkAdd(maps);
    db.table("states").bulkAdd(mapStates);
    const tokens = getDefaultTokens(userId);
    db.table("tokens").bulkAdd(tokens);
    db.table("groups").bulkAdd([
      { id: "maps", items: maps.map((map) => ({ id: map.id, type: "item" })) },
      {
        id: "tokens",
        items: tokens.map((token) => ({ id: token.id, type: "item" })),
      },
    ]);
  });
}

/**
 * Get a Dexie database with a name and versions applied
 * @param {DexieOptions} options
 * @param {string=} name
 * @param {number=} versionNumber
 * @param {boolean=} populateData
 * @returns {Dexie}
 */
export function getDatabase(
  options,
  name = "OwlbearRodeoDB",
  versionNumber = latestVersion,
  populateData = true
) {
  let db = new Dexie(name, options);
  loadVersions(db, versionNumber);
  if (populateData) {
    populate(db);
  }
  return db;
}

import Dexie from "dexie";

const db = new Dexie("OwlbearRodeoDB");
db.version(1).stores({
  maps: "id",
  states: "mapId",
  tokens: "id",
});

export default db;

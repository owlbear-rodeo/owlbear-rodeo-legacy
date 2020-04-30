import Dexie from "dexie";

const db = new Dexie("OwlbearRodeoDB");
db.version(1).stores({
  maps: "id, owner",
  states: "mapId",
  tokens: "id, owner",
  user: "key",
});

export default db;

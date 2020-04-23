import Dexie from "dexie";

const db = new Dexie("OwlbearRodeoDB");
db.version(1).stores({ maps: "id", states: "mapId" });

export default db;

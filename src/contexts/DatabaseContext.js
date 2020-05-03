import React, { useState, useEffect } from "react";
import Dexie from "dexie";

const DatabaseContext = React.createContext();

export function DatabaseProvider({ children }) {
  const [database, setDatabase] = useState();
  const [databaseStatus, setDatabaseStatus] = useState("loading");

  function loadVersions(db) {
    db.version(1).stores({
      maps: "id, owner",
      states: "mapId",
      tokens: "id, owner",
      user: "key",
    });
  }

  useEffect(() => {
    // Create a test database and open it to see if indexedDB is enabled
    let testDBRequest = window.indexedDB.open("__test");
    testDBRequest.onsuccess = function () {
      testDBRequest.result.close();
      let db = new Dexie("OwlbearRodeoDB");
      loadVersions(db);
      setDatabase(db);
      setDatabaseStatus("loaded");
      window.indexedDB.deleteDatabase("__test");
    };
    // If indexedb disabled create an in memory database
    testDBRequest.onerror = async function () {
      console.warn("Database is disabled, no state will be saved");
      const indexedDB = await import("fake-indexeddb");
      const IDBKeyRange = await import("fake-indexeddb/lib/FDBKeyRange");
      let db = new Dexie("OwlbearRodeoDB", { indexedDB, IDBKeyRange });
      loadVersions(db);
      setDatabase(db);
      setDatabaseStatus("disabled");
      window.indexedDB.deleteDatabase("__test");
    };
  }, []);

  const value = {
    database,
    databaseStatus,
  };
  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export default DatabaseContext;

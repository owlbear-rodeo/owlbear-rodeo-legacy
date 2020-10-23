import React, { useState, useEffect } from "react";

import { getDatabase } from "../database";

const DatabaseContext = React.createContext();

export function DatabaseProvider({ children }) {
  const [database, setDatabase] = useState();
  const [databaseStatus, setDatabaseStatus] = useState("loading");

  useEffect(() => {
    // Create a test database and open it to see if indexedDB is enabled
    let testDBRequest = window.indexedDB.open("__test");
    testDBRequest.onsuccess = async function () {
      testDBRequest.result.close();
      let db = getDatabase({ autoOpen: false });
      setDatabase(db);
      db.on("ready", () => {
        setDatabaseStatus("loaded");
      });
      await db.open();
      window.indexedDB.deleteDatabase("__test");
    };
    // If indexedb disabled create an in memory database
    testDBRequest.onerror = async function () {
      console.warn("Database is disabled, no state will be saved");
      const indexedDB = await import("fake-indexeddb");
      const IDBKeyRange = await import("fake-indexeddb/lib/FDBKeyRange");
      let db = getDatabase({ indexedDB, IDBKeyRange, autoOpen: false });
      setDatabase(db);
      db.on("ready", () => {
        setDatabaseStatus("disabled");
      });
      await db.open();
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

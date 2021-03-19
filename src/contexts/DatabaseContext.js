import React, { useState, useEffect, useContext } from "react";
import * as Comlink from "comlink";

import ErrorBanner from "../components/banner/ErrorBanner";

import { getDatabase } from "../database";

import DatabaseWorker from "worker-loader!../workers/DatabaseWorker"; // eslint-disable-line import/no-webpack-loader-syntax

const DatabaseContext = React.createContext();

const worker = Comlink.wrap(new DatabaseWorker());

export function DatabaseProvider({ children }) {
  const [database, setDatabase] = useState();
  const [databaseStatus, setDatabaseStatus] = useState("loading");
  const [databaseError, setDatabaseError] = useState();
  // const [worker] = useState(Comlink.wrap(new DatabaseWorker()))

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

    function handleDatabaseError(event) {
      if (event.reason?.name === "QuotaExceededError") {
        event.preventDefault();
        setDatabaseError({
          name: event.reason.name,
          message: "Storage Quota Exceeded Please Clear Space and Try Again.",
        });
      }
    }
    window.addEventListener("unhandledrejection", handleDatabaseError);

    return () => {
      window.removeEventListener("unhandledrejection", handleDatabaseError);
    };
  }, []);

  const value = {
    database,
    databaseStatus,
    databaseError,
    worker,
  };
  return (
    <DatabaseContext.Provider value={value}>
      <>
        {children}
        <ErrorBanner
          error={databaseError}
          onRequestClose={() => setDatabaseError()}
        />
      </>
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}

export default DatabaseContext;

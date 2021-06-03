import React, { useState, useEffect, useContext, SetStateAction } from "react";
import Comlink, { Remote } from "comlink";

import ErrorBanner from "../components/banner/ErrorBanner";

import { getDatabase } from "../database";

//@ts-ignore
import DatabaseWorker from "worker-loader!../workers/DatabaseWorker"; // eslint-disable-line import/no-webpack-loader-syntax
import Dexie from "dexie";

type DatabaseContext = { database: Dexie | undefined; databaseStatus: any; databaseError: Error | undefined; worker: Remote<any>; }

// TODO: check what default we want here
const DatabaseContext = React.createContext< DatabaseContext | undefined>(undefined);

const worker = Comlink.wrap(new DatabaseWorker());

export function DatabaseProvider({ children }: { children: any}) {
  const [database, setDatabase]: [ database: Dexie | undefined, setDatabase: React.Dispatch<SetStateAction<Dexie | undefined>>] = useState();
  const [databaseStatus, setDatabaseStatus]: [ datebaseStatus: any, setDatabaseStatus: React.Dispatch<SetStateAction<string>>] = useState("loading");
  const [databaseError, setDatabaseError]: [ databaseError: Error | undefined, setDatabaseError: React.Dispatch<SetStateAction<Error | undefined>>] = useState();

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

    function handleDatabaseError(event: any) {
      event.preventDefault();
      if (event.reason?.message.startsWith("QuotaExceededError")) {
        setDatabaseError({
          name: event.reason.name,
          message: "Storage Quota Exceeded Please Clear Space and Try Again.",
        });
      } else {
        setDatabaseError({
          name: event.reason.name,
          message: "Something went wrong, please refresh your browser.",
        });
      }
      console.error(event.reason);
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
          onRequestClose={() => setDatabaseError(undefined)}
        />
      </>
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContext {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}

export default DatabaseContext;

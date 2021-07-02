import React, { useState, useEffect, useContext } from "react";
import Dexie from "dexie";
import * as Comlink from "comlink";

import ErrorBanner from "../components/banner/ErrorBanner";

import { getDatabase } from "../database";

//@ts-ignore
import DatabaseWorker from "worker-loader!../workers/DatabaseWorker"; // eslint-disable-line import/no-webpack-loader-syntax

type DatabaseContext = {
  database: Dexie | undefined;
  databaseStatus: any;
  databaseError: Error | undefined;
  worker: Comlink.Remote<any>;
};

// TODO: check what default we want here
const DatabaseContext =
  React.createContext<DatabaseContext | undefined>(undefined);

const worker = Comlink.wrap(new DatabaseWorker());

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [database, setDatabase] = useState<Dexie>();
  const [databaseStatus, setDatabaseStatus] =
    useState<"loading" | "disabled" | "upgrading" | "loaded">("loading");
  const [databaseError, setDatabaseError] = useState<Error>();

  useEffect(() => {
    // Create a test database and open it to see if indexedDB is enabled
    let testDBRequest = window.indexedDB.open("__test");
    testDBRequest.onsuccess = async function () {
      testDBRequest.result.close();
      let db = getDatabase(
        { autoOpen: false },
        undefined,
        undefined,
        true,
        () => {
          setDatabaseStatus("upgrading");
        }
      );
      setDatabase(db);
      db.on("ready", () => {
        setDatabaseStatus("loaded");
      });
      db.on("versionchange", () => {
        // When another tab loads a new version of the database refresh the page
        window.location.reload();
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

    function handleDatabaseError(event: PromiseRejectionEvent) {
      if (event) {
        event.preventDefault();
        if (event.reason instanceof Dexie.DexieError) {
          if (event.reason?.inner?.name === "QuotaExceededError") {
            setDatabaseError({
              name: event.reason?.name,
              message:
                "Storage Quota Exceeded Please Clear Space and Try Again.",
            });
          } else if (event.reason?.inner?.name === "DatabaseClosedError") {
            setDatabaseError({
              name: event.reason?.name,
              message: "Database closed, please refresh your browser.",
            });
          } else {
            setDatabaseError({
              name: event.reason?.name,
              message: "Something went wrong, please refresh your browser.",
            });
          }
        } else {
          setDatabaseError({
            name: event.reason?.name,
            message: "Something went wrong, please refresh your browser.",
          });
        }
        console.error(event.reason);
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

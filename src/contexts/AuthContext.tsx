import React, { useState, useEffect, useContext, SetStateAction } from "react";
import shortid from "shortid";

import { useDatabase } from "./DatabaseContext";

import FakeStorage from "../helpers/FakeStorage";

type AuthContext = { userId: string; password: string; setPassword: React.Dispatch<any>; }

// TODO: check what default value we want here
const AuthContext = React.createContext<AuthContext | undefined>(undefined);

let storage: Storage | FakeStorage;
try {
  sessionStorage.setItem("__test", "__test");
  sessionStorage.removeItem("__test");
  storage = sessionStorage;
} catch (e) {
  console.warn("Session storage is disabled, no authentication will be saved");
  storage = new FakeStorage();
}

export function AuthProvider({ children }: { children: any }) {
  const { database, databaseStatus } = useDatabase();

  const [password, setPassword] = useState<string>(storage.getItem("auth") || "");

  useEffect(() => {
    storage.setItem("auth", password);
  }, [password]);

  // TODO: check pattern here -> undefined or empty default values
  const [userId, setUserId]: [ userId: string, setUserId: React.Dispatch<SetStateAction<string>> ] = useState("");
  useEffect(() => {
    if (!database || databaseStatus === "loading") {
      return;
    }
    async function loadUserId() {
      const storedUserId = await database?.table("user").get("userId");
      if (storedUserId) {
        setUserId(storedUserId.value);
      } else {
        const id = shortid.generate();
        setUserId(id);
        database?.table("user").add({ key: "userId", value: id });
      }
    }

    loadUserId();
  }, [database, databaseStatus]);

  const value = {
    userId,
    password,
    setPassword,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}

export default AuthContext;

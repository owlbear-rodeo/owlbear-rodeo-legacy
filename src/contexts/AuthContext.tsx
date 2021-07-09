import React, { useState, useEffect, useContext } from "react";

import FakeStorage from "../helpers/FakeStorage";

type AuthContext = {
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
};

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState<string>(
    storage.getItem("auth") || ""
  );

  useEffect(() => {
    storage.setItem("auth", password);
  }, [password]);

  const value = {
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

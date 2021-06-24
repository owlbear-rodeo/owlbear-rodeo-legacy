import React, { useState, useEffect, useContext } from "react";

import FakeStorage from "../helpers/FakeStorage";

const AuthContext = React.createContext();

let storage;
try {
  sessionStorage.setItem("__test", "__test");
  sessionStorage.removeItem("__test");
  storage = sessionStorage;
} catch (e) {
  console.warn("Session storage is disabled, no authentication will be saved");
  storage = new FakeStorage();
}

export function AuthProvider({ children }) {
  const [password, setPassword] = useState(storage.getItem("auth") || "");

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

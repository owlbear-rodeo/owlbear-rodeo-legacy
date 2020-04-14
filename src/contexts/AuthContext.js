import React, { useState, useEffect } from "react";

const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const [password, setPassword] = useState(
    sessionStorage.getItem("auth") || ""
  );

  useEffect(() => {
    sessionStorage.setItem("auth", password);
  }, [password]);

  const [authenticationStatus, setAuthenticationStatus] = useState("unknown");

  const value = {
    password,
    setPassword,
    authenticationStatus,
    setAuthenticationStatus,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

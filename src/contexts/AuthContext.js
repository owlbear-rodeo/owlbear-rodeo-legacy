import React, { useState, useEffect } from "react";
import shortid from "shortid";

const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const [password, setPassword] = useState(
    sessionStorage.getItem("auth") || ""
  );

  useEffect(() => {
    sessionStorage.setItem("auth", password);
  }, [password]);

  const [authenticationStatus, setAuthenticationStatus] = useState("unknown");

  const [userId, setUserId] = useState();
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const id = shortid.generate();
      setUserId(id);
      localStorage.setItem("userId", id);
    }
  }, []);

  const value = {
    userId,
    password,
    setPassword,
    authenticationStatus,
    setAuthenticationStatus,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

import React, { useState, useEffect } from "react";
import shortid from "shortid";

import { getRandomMonster } from "../helpers/monsters";

import db from "../database";

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
    async function loadUserId() {
      const storedUserId = await db.table("user").get("userId");
      if (storedUserId) {
        setUserId(storedUserId.value);
      } else {
        const id = shortid.generate();
        setUserId(id);
        db.table("user").add({ key: "userId", value: id });
      }
    }

    loadUserId();
  }, []);

  const [nickname, setNickname] = useState("");
  useEffect(() => {
    async function loadNickname() {
      const storedNickname = await db.table("user").get("nickname");
      if (storedNickname) {
        setNickname(storedNickname.value);
      } else {
        const name = getRandomMonster();
        setNickname(name);
        db.table("user").add({ key: "nickname", value: name });
      }
    }

    loadNickname();
  }, []);

  useEffect(() => {
    if (nickname !== undefined) {
      db.table("user").update("nickname", { value: nickname });
    }
  }, [nickname]);

  const value = {
    userId,
    nickname,
    setNickname,
    password,
    setPassword,
    authenticationStatus,
    setAuthenticationStatus,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

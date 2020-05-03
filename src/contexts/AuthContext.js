import React, { useState, useEffect, useContext } from "react";
import shortid from "shortid";

import DatabaseContext from "./DatabaseContext";

import { getRandomMonster } from "../helpers/monsters";

const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const { database } = useContext(DatabaseContext);

  const [password, setPassword] = useState(
    sessionStorage.getItem("auth") || ""
  );

  useEffect(() => {
    sessionStorage.setItem("auth", password);
  }, [password]);

  const [authenticationStatus, setAuthenticationStatus] = useState("unknown");

  const [userId, setUserId] = useState();
  useEffect(() => {
    if (!database) {
      return;
    }
    async function loadUserId() {
      const storedUserId = await database.table("user").get("userId");
      if (storedUserId) {
        setUserId(storedUserId.value);
      } else {
        const id = shortid.generate();
        setUserId(id);
        database.table("user").add({ key: "userId", value: id });
      }
    }

    loadUserId();
  }, [database]);

  const [nickname, setNickname] = useState("");
  useEffect(() => {
    if (!database) {
      return;
    }
    async function loadNickname() {
      const storedNickname = await database.table("user").get("nickname");
      if (storedNickname) {
        setNickname(storedNickname.value);
      } else {
        const name = getRandomMonster();
        setNickname(name);
        database.table("user").add({ key: "nickname", value: name });
      }
    }

    loadNickname();
  }, [database]);

  useEffect(() => {
    if (nickname !== undefined && database !== undefined) {
      database.table("user").update("nickname", { value: nickname });
    }
  }, [nickname, database]);

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

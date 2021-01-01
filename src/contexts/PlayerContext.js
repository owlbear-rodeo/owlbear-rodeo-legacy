import React, { useEffect, useContext, useState } from "react";
import compare from "fast-deep-equal";

import useNetworkedState from "../helpers/useNetworkedState";
import DatabaseContext from "./DatabaseContext";
import AuthContext from "./AuthContext";

import { getRandomMonster } from "../helpers/monsters";

export const PlayerStateContext = React.createContext();
export const PlayerUpdaterContext = React.createContext(() => {});

export function PlayerProvider({ session, children }) {
  const { userId } = useContext(AuthContext);
  const { database, databaseStatus } = useContext(DatabaseContext);

  const [playerState, setPlayerState] = useNetworkedState(
    {
      nickname: "",
      timer: null,
      dice: { share: false, rolls: [] },
      sessionId: null,
      userId,
    },
    session,
    "player_state"
  );

  useEffect(() => {
    if (!database || databaseStatus === "loading") {
      return;
    }
    async function loadNickname() {
      const storedNickname = await database.table("user").get("nickname");
      if (storedNickname !== undefined) {
        setPlayerState((prevState) => ({
          ...prevState,
          nickname: storedNickname.value,
        }));
      } else {
        const name = getRandomMonster();
        setPlayerState((prevState) => ({ ...prevState, nickname: name }));
        database.table("user").add({ key: "nickname", value: name });
      }
    }

    loadNickname();
  }, [database, databaseStatus, setPlayerState]);

  useEffect(() => {
    if (
      playerState.nickname &&
      database !== undefined &&
      databaseStatus !== "loading"
    ) {
      database
        .table("user")
        .update("nickname", { value: playerState.nickname });
    }
  }, [playerState, database, databaseStatus]);

  useEffect(() => {
    setPlayerState((prevState) => ({
      ...prevState,
      userId,
    }));
  }, [userId, setPlayerState]);

  useEffect(() => {
    function handleSocketConnect() {
      // Set the player state to trigger a sync
      setPlayerState({ ...playerState, sessionId: session.id });
    }

    session.on("connected", handleSocketConnect);
    session.socket?.on("connect", handleSocketConnect);
    session.socket?.on("reconnect", handleSocketConnect);

    return () => {
      session.off("connected", handleSocketConnect);
      session.socket?.off("connect", handleSocketConnect);
      session.socket?.off("reconnect", handleSocketConnect);
    };
  });

  return (
    <PlayerStateContext.Provider value={playerState}>
      <PlayerUpdaterContext.Provider value={setPlayerState}>
        {children}
      </PlayerUpdaterContext.Provider>
    </PlayerStateContext.Provider>
  );
}

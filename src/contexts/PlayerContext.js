import React, { useState, useEffect, useContext } from "react";

import useNetworkedState from "../helpers/useNetworkedState";
import DatabaseContext from "./DatabaseContext";
import AuthContext from "./AuthContext";

import { getRandomMonster } from "../helpers/monsters";

const PlayerContext = React.createContext();

export function PlayerProvider({ session, children }) {
  const { userId } = useContext(AuthContext);
  const { database, databaseStatus } = useContext(DatabaseContext);

  const [playerState, setPlayerState] = useNetworkedState(
    {
      nickname: "",
      timer: null,
      dice: { share: false, rolls: [] },
      pointer: {},
      sessionId: null,
      userId,
    },
    session,
    "player_state"
  );
  const [partyState, setPartyState] = useState({});

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
  }, [database, databaseStatus]);

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
  }, [userId]);

  useEffect(() => {
    function handleSocketConnect() {
      // Set the player state to trigger a sync
      setPlayerState({ ...playerState, sessionId: session.id });
    }

    function handleSocketPartyState(partyState) {
      if (partyState) {
        const { [session.id]: _, ...otherMembersState } = partyState;
        setPartyState(otherMembersState);
      } else {
        setPartyState({});
      }
    }

    session.on("connected", handleSocketConnect);

    if (session.socket) {
      session.socket.on("connect", handleSocketConnect);
      session.socket.on("reconnect", handleSocketConnect);
      session.socket.on("party_state", handleSocketPartyState);
    }

    return () => {
      session.off("connected", handleSocketConnect);

      if (session.socket) {
        session.socket.off("connect", handleSocketConnect);
        session.socket.off("reconnect", handleSocketConnect);
        session.socket.off("party_state", handleSocketPartyState);
      }
    };
  });

  const value = {
    playerState,
    setPlayerState,
    partyState,
  };
  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export default PlayerContext;

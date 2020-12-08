import React, { useState, useEffect, useContext } from "react";

import useNetworkedState from "../helpers/useNetworkedState";
import DatabaseContext from "./DatabaseContext";

import { getRandomMonster } from "../helpers/monsters";

const PlayerContext = React.createContext();

export function PlayerProvider({ session, children }) {
  const { database, databaseStatus } = useContext(DatabaseContext);

  const [playerState, setPlayerState] = useNetworkedState(
    {
      nickname: "",
      timer: null,
      dice: { share: false, rolls: [] },
      pointer: {},
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
    function handleConnected() {
      // Set the player state to trigger a sync
      setPlayerState(playerState);
    }

    function handleSocketPartyState(partyState) {
      if (partyState) {
        const { [session.id]: _, ...otherMembersState } = partyState;
        setPartyState(otherMembersState);
      } else {
        setPartyState({});
      }
    }

    if (session.socket) {
      session.on("connected", handleConnected);
      session.socket.on("party_state", handleSocketPartyState);
    }

    return () => {
      if (session.socket) {
        session.off("connected", handleConnected);
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

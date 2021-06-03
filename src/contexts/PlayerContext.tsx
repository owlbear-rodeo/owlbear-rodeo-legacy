import React, { useEffect, useContext } from "react";

import { useDatabase } from "./DatabaseContext";
import { useAuth } from "./AuthContext";

import { getRandomMonster } from "../helpers/monsters";

import useNetworkedState from "../hooks/useNetworkedState";
import Session from "../network/Session";
import { PlayerInfo } from "../components/party/PartyState";

export const PlayerStateContext = React.createContext<any>(undefined);
export const PlayerUpdaterContext = React.createContext<any>(() => {});

export function PlayerProvider({ session, children }: { session: Session, children: any}) {
  const { userId } = useAuth();
  const { database, databaseStatus } = useDatabase();

  const [playerState, setPlayerState] = useNetworkedState(
    {
      nickname: "",
      timer: null,
      dice: { share: false, rolls: [] },
      sessionId: null,
      userId,
    },
    session,
    "player_state",
    500,
    false
  );

  useEffect(() => {
    if (!database || databaseStatus === "loading") {
      return;
    }
    async function loadNickname() {
      const storedNickname = await database?.table("user").get("nickname");
      if (storedNickname !== undefined) {
        setPlayerState((prevState: PlayerInfo) => ({
          ...prevState,
          nickname: storedNickname.value,
        }));
      } else {
        const name = getRandomMonster();
        setPlayerState((prevState: any) => ({ ...prevState, nickname: name }));
        database?.table("user").add({ key: "nickname", value: name });
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
    if (userId) {
      setPlayerState((prevState: PlayerInfo) => {
        if (prevState) {
          return {
            ...prevState,
            userId,
          };
        }
        return prevState;
      });
    }
  }, [userId, setPlayerState]);

  useEffect(() => {
    function updateSessionId() {
      setPlayerState((prevState: PlayerInfo) => {
        // TODO: check useNetworkState requirements here
        if (prevState) {
          return {
            ...prevState,
            sessionId: session.id,
          };
        }
        return prevState;
      });
    }
    function handleSocketConnect() {
      // Set the player state to trigger a sync
      updateSessionId();
    }

    function handleSocketStatus(status: string) {
      if (status === "joined") {
        updateSessionId();
      }
    }

    session.on("status", handleSocketStatus);
    session.socket?.on("connect", handleSocketConnect);
    session.socket?.io.on("reconnect", handleSocketConnect);

    return () => {
      session.off("status", handleSocketStatus);
      session.socket?.off("connect", handleSocketConnect);
      session.socket?.io.off("reconnect", handleSocketConnect);
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

export function usePlayerState() {
  const context = useContext(PlayerStateContext);
  if (context === undefined) {
    throw new Error("usePlayerState must be used within a PlayerProvider");
  }
  return context;
}

export function usePlayerUpdater() {
  const context = useContext(PlayerUpdaterContext);
  if (context === undefined) {
    throw new Error("usePlayerUpdater must be used within a PlayerProvider");
  }
  return context;
}

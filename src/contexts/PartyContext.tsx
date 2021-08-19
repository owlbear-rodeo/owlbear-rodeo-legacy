import React, { useState, useEffect, useContext } from "react";
import Session from "../network/Session";

import { PartyState } from "../types/PartyState";

const PartyContext = React.createContext<PartyState | undefined>(undefined);

type PartyProviderProps = {
  session: Session;
  children: React.ReactNode;
};

export function PartyProvider({ session, children }: PartyProviderProps) {
  const [partyState, setPartyState] = useState<PartyState>({});

  useEffect(() => {
    function handleSocketPartyState(partyState: PartyState) {
      if (partyState) {
        const { [session.id]: _, ...otherMembersState } = partyState;
        setPartyState(otherMembersState);
      } else {
        setPartyState({});
      }
    }

    session.socket?.on("party_state", handleSocketPartyState);

    return () => {
      session.socket?.off("party_state", handleSocketPartyState);
    };
  });

  return (
    <PartyContext.Provider value={partyState}>{children}</PartyContext.Provider>
  );
}

export function useParty() {
  const context = useContext(PartyContext);
  if (context === undefined) {
    throw new Error("useParty must be used within a PartyProvider");
  }
  return context;
}

export default PartyContext;

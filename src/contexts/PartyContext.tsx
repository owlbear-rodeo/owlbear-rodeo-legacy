import React, { useState, useEffect, useContext } from "react";
import { PartyState } from "../components/party/PartyState";
import Session from "../network/Session";

const PartyContext = React.createContext<PartyState | undefined>(undefined);

export function PartyProvider({ session, children }: { session: Session, children: any}) {
  const [partyState, setPartyState] = useState({});

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

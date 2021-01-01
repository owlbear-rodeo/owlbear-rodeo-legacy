import React, { useState, useEffect } from "react";

const PartyContext = React.createContext();

export function PartyProvider({ session, children }) {
  const [partyState, setPartyState] = useState({});

  useEffect(() => {
    function handleSocketPartyState(partyState) {
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

export default PartyContext;

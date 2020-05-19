import React, { useEffect, useState, useContext } from "react";

import AuthContext from "./AuthContext";
import DatabaseContext from "./DatabaseContext";

import { tokens as defaultTokens } from "../tokens";

const TokenDataContext = React.createContext();

export function TokenDataProvider({ children }) {
  const { database } = useContext(DatabaseContext);
  const { userId } = useContext(AuthContext);

  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const defaultTokensWithIds = [];
    for (let defaultToken of defaultTokens) {
      defaultTokensWithIds.push({
        ...defaultToken,
        id: `__default-${defaultToken.key}`,
        owner: userId,
      });
    }
    setTokens(defaultTokensWithIds);
  }, [userId]);

  const value = { tokens };

  return (
    <TokenDataContext.Provider value={value}>
      {children}
    </TokenDataContext.Provider>
  );
}

export default TokenDataContext;

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
    if (!userId || !database) {
      return;
    }
    function getDefaultTokes() {
      const defaultTokensWithIds = [];
      for (let defaultToken of defaultTokens) {
        defaultTokensWithIds.push({
          ...defaultToken,
          id: `__default-${defaultToken.key}`,
          owner: userId,
        });
      }
      return defaultTokensWithIds;
    }

    async function loadTokens() {
      let storedTokens = await database.table("tokens").toArray();
      const sortedTokens = storedTokens.sort((a, b) => b.created - a.created);
      const defaultTokensWithIds = getDefaultTokes();
      const allTokens = [...sortedTokens, ...defaultTokensWithIds];
      setTokens(allTokens);
    }

    loadTokens();
  }, [userId, database]);

  async function addToken(token) {
    await database.table("tokens").add(token);
    setTokens((prevTokens) => [token, ...prevTokens]);
  }

  async function removeToken(id) {
    await database.table("tokens").delete(id);
    setTokens((prevTokens) => {
      const filtered = prevTokens.filter((token) => token.id !== id);
      return filtered;
    });
  }

  async function updateToken(id, update) {
    const change = { ...update, lastModified: Date.now() };
    await database.table("tokens").update(id, change);
    setTokens((prevTokens) => {
      const newTokens = [...prevTokens];
      const i = newTokens.findIndex((token) => token.id === id);
      if (i > -1) {
        newTokens[i] = { ...newTokens[i], ...change };
      }
      return newTokens;
    });
  }

  async function putToken(token) {
    await database.table("tokens").put(token);
    setTokens((prevTokens) => {
      const newTokens = [...prevTokens];
      const i = newTokens.findIndex((t) => t.id === token.id);
      if (i > -1) {
        newTokens[i] = { ...newTokens[i], ...token };
      } else {
        newTokens.unshift(token);
      }
      return newTokens;
    });
  }

  function getToken(tokenId) {
    return tokens.find((token) => token.id === tokenId);
  }

  const ownedTokens = tokens.filter((token) => token.owner === userId);

  const value = {
    tokens,
    ownedTokens,
    addToken,
    removeToken,
    updateToken,
    putToken,
    getToken,
  };

  return (
    <TokenDataContext.Provider value={value}>
      {children}
    </TokenDataContext.Provider>
  );
}

export default TokenDataContext;

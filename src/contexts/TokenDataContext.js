import React, { useEffect, useState, useContext } from "react";
import * as Comlink from "comlink";

import AuthContext from "./AuthContext";
import DatabaseContext from "./DatabaseContext";

import DatabaseWorker from "worker-loader!../workers/DatabaseWorker"; // eslint-disable-line import/no-webpack-loader-syntax

import { tokens as defaultTokens } from "../tokens";
import { logError } from "../helpers/logging";

const TokenDataContext = React.createContext();

const cachedTokenMax = 100;

export function TokenDataProvider({ children }) {
  const { database, databaseStatus } = useContext(DatabaseContext);
  const { userId } = useContext(AuthContext);

  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(true);

  useEffect(() => {
    if (!userId || !database || databaseStatus === "loading") {
      return;
    }
    function getDefaultTokes() {
      const defaultTokensWithIds = [];
      for (let defaultToken of defaultTokens) {
        defaultTokensWithIds.push({
          ...defaultToken,
          id: `__default-${defaultToken.name}`,
          owner: userId,
          group: "default",
        });
      }
      return defaultTokensWithIds;
    }

    async function loadTokens() {
      const worker = Comlink.wrap(new DatabaseWorker());
      await worker.loadData("tokens");
      const storedTokens = await worker.data;
      const sortedTokens = storedTokens.sort((a, b) => b.created - a.created);
      const defaultTokensWithIds = getDefaultTokes();
      const allTokens = [...sortedTokens, ...defaultTokensWithIds];
      setTokens(allTokens);
      setTokensLoading(false);
    }

    loadTokens();
  }, [userId, database, databaseStatus]);

  async function addToken(token) {
    await database.table("tokens").add(token);
    setTokens((prevTokens) => [token, ...prevTokens]);
    if (token.owner !== userId) {
      await updateCache();
    }
  }

  async function removeToken(id) {
    await database.table("tokens").delete(id);
    setTokens((prevTokens) => {
      const filtered = prevTokens.filter((token) => token.id !== id);
      return filtered;
    });
  }

  async function removeTokens(ids) {
    await database.table("tokens").bulkDelete(ids);
    setTokens((prevTokens) => {
      const filtered = prevTokens.filter((token) => !ids.includes(token.id));
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

  async function updateTokens(ids, update) {
    const change = { ...update, lastModified: Date.now() };
    await Promise.all(
      ids.map((id) => database.table("tokens").update(id, change))
    );
    setTokens((prevTokens) => {
      const newTokens = [...prevTokens];
      for (let id of ids) {
        const i = newTokens.findIndex((token) => token.id === id);
        if (i > -1) {
          newTokens[i] = { ...newTokens[i], ...change };
        }
      }
      return newTokens;
    });
  }

  async function putToken(token) {
    try {
      await database.table("tokens").put(token);
    } catch {
      if (token?.file) {
        const { file, ...rest } = token;
        logError(`Unable to save token ${JSON.stringify(rest)}`);
      } else {
        logError(`Unable to save token ${JSON.stringify(token)}`);
      }
    }
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
    if (token.owner !== userId) {
      await updateCache();
    }
  }

  /**
   * Keep up to cachedTokenMax amount of tokens that you don't own
   * Sorted by when they we're last used
   */
  async function updateCache() {
    const cachedTokens = await database
      .table("tokens")
      .where("owner")
      .notEqual(userId)
      .sortBy("lastUsed");
    if (cachedTokens.length > cachedTokenMax) {
      const cacheDeleteCount = cachedTokens.length - cachedTokenMax;
      const idsToDelete = cachedTokens
        .slice(0, cacheDeleteCount)
        .map((token) => token.id);
      database.table("tokens").where("id").anyOf(idsToDelete).delete();
      setTokens((prevTokens) => {
        return prevTokens.filter((token) => !idsToDelete.includes(token.id));
      });
    }
  }

  function getToken(tokenId) {
    return tokens.find((token) => token.id === tokenId);
  }

  const ownedTokens = tokens.filter((token) => token.owner === userId);

  const tokensById = tokens.reduce((obj, token) => {
    obj[token.id] = token;
    return obj;
  }, {});

  const value = {
    tokens,
    ownedTokens,
    addToken,
    removeToken,
    removeTokens,
    updateToken,
    updateTokens,
    putToken,
    getToken,
    tokensById,
    tokensLoading,
  };

  return (
    <TokenDataContext.Provider value={value}>
      {children}
    </TokenDataContext.Provider>
  );
}

export default TokenDataContext;

import React, { useEffect, useState, useContext, useCallback } from "react";

import { useAuth } from "./AuthContext";
import { useDatabase } from "./DatabaseContext";

import { applyObservableChange } from "../helpers/dexie";
import { removeGroupsItems } from "../helpers/group";

const TokenDataContext = React.createContext();

export function TokenDataProvider({ children }) {
  const { database, databaseStatus } = useDatabase();
  const { userId } = useAuth();

  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokenGroups, setTokenGroups] = useState([]);

  useEffect(() => {
    if (!userId || !database || databaseStatus === "loading") {
      return;
    }

    async function loadTokens() {
      const storedTokens = await database.table("tokens").toArray();
      setTokens(storedTokens);
      const group = await database.table("groups").get("tokens");
      const storedGroups = group.items;
      setTokenGroups(storedGroups);
      setTokensLoading(false);
    }

    loadTokens();
  }, [userId, database, databaseStatus]);

  const getToken = useCallback(
    async (tokenId) => {
      let token = await database.table("tokens").get(tokenId);
      return token;
    },
    [database]
  );

  // Add token and add it to the token group
  const addToken = useCallback(
    async (token) => {
      await database.table("tokens").add(token);
      const group = await database.table("groups").get("tokens");
      await database.table("groups").update("tokens", {
        items: [{ id: token.id, type: "item" }, ...group.items],
      });
    },
    [database]
  );

  const removeTokens = useCallback(
    async (ids) => {
      const tokens = await database.table("tokens").bulkGet(ids);
      let assetIds = [];
      for (let token of tokens) {
        if (token.type === "file") {
          assetIds.push(token.file);
          assetIds.push(token.thumbnail);
        }
      }

      const group = await database.table("groups").get("tokens");
      let items = removeGroupsItems(group.items, ids);
      await database.table("groups").update("tokens", { items });

      await database.table("tokens").bulkDelete(ids);
      await database.table("assets").bulkDelete(assetIds);
    },
    [database]
  );

  const updateToken = useCallback(
    async (id, update) => {
      await database.table("tokens").update(id, update);
    },
    [database]
  );

  const updateTokensHidden = useCallback(
    async (ids, hideInSidebar) => {
      // Update immediately to avoid UI delay
      setTokens((prevTokens) => {
        let newTokens = [...prevTokens];
        for (let id of ids) {
          const tokenIndex = newTokens.findIndex((token) => token.id === id);
          newTokens[tokenIndex].hideInSidebar = hideInSidebar;
        }
        return newTokens;
      });
      await Promise.all(
        ids.map((id) => database.table("tokens").update(id, { hideInSidebar }))
      );
    },
    [database]
  );

  const updateTokenGroups = useCallback(
    async (groups) => {
      // Update group state immediately to avoid animation delay
      setTokenGroups(groups);
      await database.table("groups").update("tokens", { items: groups });
    },
    [database]
  );

  // Create DB observable to sync creating and deleting
  useEffect(() => {
    if (!database || databaseStatus === "loading") {
      return;
    }

    function handleTokenChanges(changes) {
      // Pool token changes together to call a single state update at the end
      let tokensCreated = [];
      let tokensUpdated = {};
      let tokensDeleted = [];
      for (let change of changes) {
        if (change.table === "tokens") {
          if (change.type === 1) {
            // Created
            const token = change.obj;
            tokensCreated.push(token);
          } else if (change.type === 2) {
            // Updated
            const token = change.obj;
            tokensUpdated[token.id] = token;
          } else if (change.type === 3) {
            // Deleted
            const id = change.key;
            tokensDeleted.push(id);
          }
        }
        if (change.table === "groups") {
          if (change.type === 2 && change.key === "tokens") {
            const group = applyObservableChange(change);
            const groups = group.items.filter((item) => item !== null);
            setTokenGroups(groups);
          }
        }
      }
      const tokensUpdatedArray = Object.values(tokensUpdated);
      if (
        tokensCreated.length > 0 ||
        tokensUpdatedArray.length > 0 ||
        tokensDeleted.length > 0
      ) {
        setTokens((prevTokens) => {
          let newTokens = [...tokensCreated, ...prevTokens];
          for (let token of tokensUpdatedArray) {
            const tokenIndex = newTokens.findIndex((t) => t.id === token.id);
            if (tokenIndex > -1) {
              newTokens[tokenIndex] = token;
            }
          }
          return newTokens.filter((token) => !tokensDeleted.includes(token.id));
        });
      }
    }

    database.on("changes", handleTokenChanges);

    return () => {
      database.on("changes").unsubscribe(handleTokenChanges);
    };
  }, [database, databaseStatus]);

  const [tokensById, setTokensById] = useState({});
  useEffect(() => {
    setTokensById(
      tokens.reduce((obj, token) => {
        obj[token.id] = token;
        return obj;
      }, {})
    );
  }, [tokens]);

  const value = {
    tokens,
    addToken,
    tokenGroups,
    removeTokens,
    updateToken,
    tokensById,
    tokensLoading,
    getToken,
    updateTokenGroups,
    updateTokensHidden,
  };

  return (
    <TokenDataContext.Provider value={value}>
      {children}
    </TokenDataContext.Provider>
  );
}

export function useTokenData() {
  const context = useContext(TokenDataContext);
  if (context === undefined) {
    throw new Error("useTokenData must be used within a TokenDataProvider");
  }
  return context;
}

export default TokenDataContext;

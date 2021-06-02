import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import { decode } from "@msgpack/msgpack";

import { useAuth } from "./AuthContext";
import { useDatabase } from "./DatabaseContext";

import { DefaultToken, FileToken, Token, tokens as defaultTokens } from "../tokens";

type TokenDataContext = {
  tokens: Token[];
  ownedTokens: Token[];
  addToken: (token: Token) => Promise<void>;
  removeToken: (id: string) => Promise<void>;
  removeTokens: (ids: string[]) => Promise<void>;
  updateToken: (id: string, update: Partial<Token>) => Promise<void>;
  updateTokens: (ids: string[], update: Partial<Token>) => Promise<void>;
  putToken: (token: Token) => Promise<void>;
  getToken: (tokenId: string) => Token | undefined
  tokensById: { [key: string]: Token; };
  tokensLoading: boolean;
  getTokenFromDB: (tokenId: string) => Promise<Token>;
  loadTokens: (tokenIds: string[]) => Promise<void>;
}

const TokenDataContext = React.createContext<TokenDataContext | undefined>(undefined);

const cachedTokenMax = 100;

export function TokenDataProvider({ children }: { children: any }) {
  const { database, databaseStatus, worker } = useDatabase();
  const { userId } = useAuth();

  /**
   * Contains all tokens without any file data,
   * to ensure file data is present call loadTokens
   */
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);

  useEffect(() => {
    if (!userId || !database || databaseStatus === "loading") {
      return;
    }
    function getDefaultTokens() {
      const defaultTokensWithIds: Required<DefaultToken[]> = [];
      for (let defaultToken of defaultTokens) {
        defaultTokensWithIds.push({
          ...defaultToken,
          id: `__default-${defaultToken.name}`,
          owner: userId,
        });
      }
      return defaultTokensWithIds;
    }

    // Loads tokens without the file data to save memory
    async function loadTokens() {
      let storedTokens: any = [];
      // Try to load tokens with worker, fallback to database if failed
      const packedTokens: ArrayLike<number> | BufferSource = await worker.loadData("tokens");
      if (packedTokens) {
        storedTokens = decode(packedTokens);
      } else {
        console.warn("Unable to load tokens with worker, loading may be slow");
        await database?.table("tokens").each((token: FileToken) => {
          const { file, ...rest } = token;
          storedTokens.push(rest);
        });
      }
      const sortedTokens = storedTokens.sort((a: any, b: any) => b.created - a.created);
      const defaultTokensWithIds = getDefaultTokens();
      const allTokens = [...sortedTokens, ...defaultTokensWithIds];
      setTokens(allTokens);
      setTokensLoading(false);
    }

    loadTokens();
  }, [userId, database, databaseStatus, worker]);

  const tokensRef = useRef(tokens);
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const getToken = useCallback((tokenId) => {
    return tokensRef.current.find((token) => token.id === tokenId);
  }, []);

  const getTokenFromDB = useCallback(
    async (tokenId) => {
      let token = await database?.table("tokens").get(tokenId);
      return token;
    },
    [database]
  );

  /**
   * Keep up to cachedTokenMax amount of tokens that you don't own
   * Sorted by when they we're last used
   */
  const updateCache = useCallback(async () => {
    const cachedTokens: Token[] | undefined = await database?.table("tokens").where("owner").notEqual(userId).sortBy("lastUsed");
    // TODO: handle undefined cachedTokens
    if (!cachedTokens) {
      return;
    }
    if (cachedTokens?.length > cachedTokenMax) {
      const cacheDeleteCount = cachedTokens.length - cachedTokenMax
      const idsToDelete = cachedTokens
        .slice(0, cacheDeleteCount)
        .map((token) => token.id);
      database?.table("tokens").where("id").anyOf(idsToDelete).delete();
    }
  }, [database, userId]);

  const addToken = useCallback(
    async (token) => {
      await database?.table("tokens").add(token);
      if (token.owner !== userId) {
        await updateCache();
      }
    },
    [database, updateCache, userId]
  );

  const removeToken = useCallback(
    async (id: string) => {
      await database?.table("tokens").delete(id);
    },
    [database]
  );

  const removeTokens = useCallback(
    async (ids: string[]) => {
      await database?.table("tokens").bulkDelete(ids);
    },
    [database]
  );

  const updateToken = useCallback(
    async (id: string, update: any) => {
      const change = { lastModified: Date.now(), ...update };
      await database?.table("tokens").update(id, change);
    },
    [database]
  );

  const updateTokens = useCallback(
    async (ids, update) => {
      const change = { lastModified: Date.now(), ...update };
      await Promise.all(
        ids.map((id: string) => database?.table("tokens").update(id, change))
      );
    },
    [database]
  );

  const putToken = useCallback(
    async (token) => {
      await database?.table("tokens").put(token);
      if (token.owner !== userId) {
        await updateCache();
      }
    },
    [database, updateCache, userId]
  );

  const loadTokens = useCallback(
    async (tokenIds: string[]) => {
      const loadedTokens: FileToken[] | undefined = await database?.table("tokens").bulkGet(tokenIds);
      const loadedTokensById = loadedTokens?.reduce((obj: { [key: string]: FileToken }, token: FileToken) => {
        obj[token.id] = token;
        return obj;
      }, {});
      if (!loadedTokensById) {
        // TODO: whatever
        return; 
      }
      setTokens((prevTokens: Token[]) => {
        return prevTokens.map((prevToken) => {
          if (prevToken.id in loadedTokensById) {
            return loadedTokensById[prevToken.id];
          } else {
            return prevToken;
          }
        });
      });
    },
    [database]
  );

  // Create DB observable to sync creating and deleting
  useEffect(() => {
    if (!database || databaseStatus === "loading") {
      return;
    }

    function handleTokenChanges(changes: any) {
      for (let change of changes) {
        if (change.table === "tokens") {
          if (change.type === 1) {
            // Created
            const token = change.obj;
            setTokens((prevTokens) => [token, ...prevTokens]);
          } else if (change.type === 2) {
            // Updated
            const token = change.obj;
            setTokens((prevTokens) => {
              const newTokens = [...prevTokens];
              const i = newTokens.findIndex((t) => t.id === token.id);
              if (i > -1) {
                newTokens[i] = token;
              }
              return newTokens;
            });
          } else if (change.type === 3) {
            // Deleted
            const id = change.key;
            setTokens((prevTokens) => {
              const filtered = prevTokens.filter((token) => token.id !== id);
              return filtered;
            });
          }
        }
      }
    }

    database.on("changes", handleTokenChanges);

    return () => {
      database.on("changes").unsubscribe(handleTokenChanges);
    };
  }, [database, databaseStatus]);

  const ownedTokens = tokens.filter((token) => token.owner === userId);

  const tokensById: { [key: string]: Token; } = tokens.reduce((obj: { [key: string]: Token }, token) => {
    obj[token.id] = token;
    return obj;
  }, {});

  const value: TokenDataContext = {
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
    getTokenFromDB,
    loadTokens,
  };

  return (
    <TokenDataContext.Provider value={value}>
      {children}
    </TokenDataContext.Provider>
  );
}

export function useTokenData(): TokenDataContext {
  const context = useContext(TokenDataContext);
  if (context === undefined) {
    throw new Error("useTokenData must be used within a TokenDataProvider");
  }
  return context;
}

export default TokenDataContext;

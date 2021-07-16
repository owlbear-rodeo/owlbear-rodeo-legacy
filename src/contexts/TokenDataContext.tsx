import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { useDatabase } from "./DatabaseContext";

import { removeGroupsItems } from "../helpers/group";

import { Token } from "../types/Token";
import { Group } from "../types/Group";

export type AddTokenEventHandler = (token: Token) => Promise<void>;
export type RemoveTokensEventHandler = (ids: string[]) => Promise<void>;
export type UpdateTokenEventHandler = (
  id: string,
  update: Partial<Token>
) => Promise<void>;
export type GetTokenEventHandler = (
  tokenId: string
) => Promise<Token | undefined>;
export type UpdateTokenGroupsEventHandler = (groups: Group[]) => Promise<void>;
export type UpdateTokensHiddenEventHandler = (
  ids: string[],
  hideInSidebar: boolean
) => Promise<void>;

type TokenDataContext = {
  tokens: Token[];
  addToken: AddTokenEventHandler;
  tokenGroups: Group[];
  removeTokens: RemoveTokensEventHandler;
  updateToken: UpdateTokenEventHandler;
  getToken: GetTokenEventHandler;
  tokensById: Record<string, Token>;
  tokensLoading: boolean;
  updateTokenGroups: UpdateTokenGroupsEventHandler;
  updateTokensHidden: UpdateTokensHiddenEventHandler;
};

const TokenDataContext =
  React.createContext<TokenDataContext | undefined>(undefined);

export function TokenDataProvider({ children }: { children: React.ReactNode }) {
  const { database } = useDatabase();

  const tokensQuery = useLiveQuery<Token[]>(
    () => database?.table("tokens").toArray() || [],
    [database]
  );

  const tokens = useMemo(() => tokensQuery || [], [tokensQuery]);
  const tokensLoading = useMemo(() => !tokensQuery, [tokensQuery]);

  const tokenGroupQuery = useLiveQuery(
    () => database?.table("groups").get("tokens"),
    [database]
  );

  const [tokenGroups, setTokenGroups] = useState<Group[]>([]);
  useEffect(() => {
    async function updateTokenGroups() {
      const group = await database?.table("groups").get("tokens");
      setTokenGroups(group.items);
    }
    if (database && tokenGroupQuery) {
      updateTokenGroups();
    }
  }, [tokenGroupQuery, database]);

  const getToken = useCallback<GetTokenEventHandler>(
    async (tokenId) => {
      let token = await database?.table("tokens").get(tokenId);
      return token;
    },
    [database]
  );

  // Add token and add it to the token group
  const addToken = useCallback<AddTokenEventHandler>(
    async (token) => {
      if (database) {
        await database.table("tokens").add(token);
        const group = await database.table("groups").get("tokens");
        await database.table("groups").update("tokens", {
          items: [{ id: token.id, type: "item" }, ...group.items],
        });
      }
    },
    [database]
  );

  const removeTokens = useCallback<RemoveTokensEventHandler>(
    async (ids) => {
      if (database) {
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
      }
    },
    [database]
  );

  const updateToken = useCallback<UpdateTokenEventHandler>(
    async (id, update) => {
      await database?.table("tokens").update(id, update);
    },
    [database]
  );

  const updateTokensHidden = useCallback<UpdateTokensHiddenEventHandler>(
    async (ids: string[], hideInSidebar: boolean) => {
      await Promise.all(
        ids.map((id) => database?.table("tokens").update(id, { hideInSidebar }))
      );
    },
    [database]
  );

  const updateTokenGroups = useCallback<UpdateTokenGroupsEventHandler>(
    async (groups: Group[]) => {
      // Update group state immediately to avoid animation delay
      setTokenGroups(groups);
      await database?.table("groups").update("tokens", { items: groups });
    },
    [database]
  );

  const [tokensById, setTokensById] = useState({});
  useEffect(() => {
    setTokensById(
      tokens.reduce((obj: Record<string, Token>, token: Token) => {
        obj[token.id] = token;
        return obj;
      }, {})
    );
  }, [tokens]);

  const value: TokenDataContext = {
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

export function useTokenData(): TokenDataContext {
  const context = useContext(TokenDataContext);
  if (context === undefined) {
    throw new Error("useTokenData must be used within a TokenDataProvider");
  }
  return context;
}

export default TokenDataContext;

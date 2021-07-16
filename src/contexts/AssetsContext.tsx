import React, { useState, useContext, useCallback, useEffect } from "react";
import * as Comlink from "comlink";
import { encode } from "@msgpack/msgpack";
import { useLiveQuery } from "dexie-react-hooks";

import { useDatabase } from "./DatabaseContext";

import useDebounce from "../hooks/useDebounce";

import { omit } from "../helpers/shared";
import { Asset } from "../types/Asset";

export type GetAssetEventHanlder = (
  assetId: string
) => Promise<Asset | undefined>;
export type AddAssetsEventHandler = (assets: Asset[]) => Promise<void>;
export type PutAssetEventsHandler = (asset: Asset) => Promise<void>;

type AssetsContext = {
  getAsset: GetAssetEventHanlder;
  addAssets: AddAssetsEventHandler;
  putAsset: PutAssetEventsHandler;
};

const AssetsContext = React.createContext<AssetsContext | undefined>(undefined);

// 100 MB max cache size
const maxCacheSize = 1e8;

export function AssetsProvider({ children }: { children: React.ReactNode }) {
  const { worker, database, databaseStatus } = useDatabase();

  useEffect(() => {
    if (databaseStatus === "loaded") {
      worker.cleanAssetCache(maxCacheSize);
    }
  }, [worker, databaseStatus]);

  const getAsset = useCallback<GetAssetEventHanlder>(
    async (assetId) => {
      if (database) {
        return await database.table("assets").get(assetId);
      }
    },
    [database]
  );

  const addAssets = useCallback<AddAssetsEventHandler>(
    async (assets) => {
      if (database) {
        await database.table("assets").bulkAdd(assets);
      }
    },
    [database]
  );

  const putAsset = useCallback<PutAssetEventsHandler>(
    async (asset) => {
      if (database) {
        // Check for broadcast channel and attempt to use worker to put map to avoid UI lockup
        // Safari doesn't support BC so fallback to single thread
        if (window.BroadcastChannel) {
          const packedAsset = encode(asset);
          const success = await worker.putData(
            Comlink.transfer(packedAsset, [packedAsset.buffer]),
            "assets"
          );
          if (!success) {
            await database.table("assets").put(asset);
          }
        } else {
          await database.table("assets").put(asset);
        }
      }
    },
    [database, worker]
  );

  const value = {
    getAsset,
    addAssets,
    putAsset,
  };

  return (
    <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetsContext);
  if (context === undefined) {
    throw new Error("useAssets must be used within a AssetsProvider");
  }
  return context;
}

/**
 * @typedef AssetURL
 * @property {string} url
 * @property {string} id
 * @property {number} references
 */

type AssetURL = {
  url: string | null;
  id: string;
  references: number;
};

type AssetURLs = Record<string, AssetURL>;

export const AssetURLsStateContext =
  React.createContext<AssetURLs | undefined>(undefined);

export const AssetURLsUpdaterContext =
  React.createContext<
    React.Dispatch<React.SetStateAction<AssetURLs>> | undefined
  >(undefined);

/**
 * Helper to manage sharing of custom image sources between uses of useAssetURL
 */
export function AssetURLsProvider({ children }: { children: React.ReactNode }) {
  const [assetURLs, setAssetURLs] = useState<AssetURLs>({});
  const { database } = useDatabase();

  // Keep track of the assets that need to be loaded
  const [assetKeys, setAssetKeys] = useState<string[]>([]);

  // Load assets after 100ms
  const loadingDebouncedAssetURLs = useDebounce(assetURLs, 100);

  // Update the asset keys to load when a url is added without an asset attached
  useEffect(() => {
    let keysToLoad: string[] = [];
    for (let url of Object.values(loadingDebouncedAssetURLs)) {
      if (url.url === null) {
        keysToLoad.push(url.id);
      }
    }
    if (keysToLoad.length > 0) {
      setAssetKeys(keysToLoad);
    }
  }, [loadingDebouncedAssetURLs]);

  // Get the new assets whenever the keys change
  const assets = useLiveQuery<Asset[]>(
    () =>
      database?.table("assets").where("id").anyOf(assetKeys).toArray() || [],
    [database, assetKeys]
  );

  // Update asset URLs when assets are loaded
  useEffect(() => {
    if (!assets || assets.length === 0) {
      return;
    }
    // Assets are about to be loaded so clear the keys to load
    setAssetKeys([]);

    setAssetURLs((prevURLs) => {
      let newURLs = { ...prevURLs };
      for (let asset of assets) {
        if (newURLs[asset.id]?.url === null) {
          newURLs[asset.id] = {
            ...newURLs[asset.id],
            url: URL.createObjectURL(
              new Blob([asset.file], { type: asset.mime })
            ),
          };
        }
      }
      return newURLs;
    });
  }, [assets]);

  // Clean up asset URLs every minute
  const cleanUpDebouncedAssetURLs = useDebounce(assetURLs, 60 * 1000);

  // Revoke url when no more references
  useEffect(() => {
    setAssetURLs((prevURLs) => {
      let urlsToCleanup = [];
      for (let url of Object.values(prevURLs)) {
        if (url.references <= 0) {
          url.url && URL.revokeObjectURL(url.url);
          urlsToCleanup.push(url.id);
        }
      }
      if (urlsToCleanup.length > 0) {
        return omit(prevURLs, urlsToCleanup);
      } else {
        return prevURLs;
      }
    });
  }, [cleanUpDebouncedAssetURLs]);

  return (
    <AssetURLsStateContext.Provider value={assetURLs}>
      <AssetURLsUpdaterContext.Provider value={setAssetURLs}>
        {children}
      </AssetURLsUpdaterContext.Provider>
    </AssetURLsStateContext.Provider>
  );
}

/**
 * Helper function to load either file or default asset into a URL
 */
export function useAssetURL(
  assetId: string,
  type: "file" | "default",
  defaultSources: Record<string, string>,
  unknownSource?: string
) {
  const assetURLs = useContext(AssetURLsStateContext);
  if (assetURLs === undefined) {
    throw new Error("useAssetURL must be used within a AssetURLsProvider");
  }
  const setAssetURLs = useContext(AssetURLsUpdaterContext);
  if (setAssetURLs === undefined) {
    throw new Error("useAssetURL must be used within a AssetURLsProvider");
  }

  useEffect(() => {
    if (!assetId || type !== "file") {
      return;
    }

    function updateAssetURL() {
      function increaseReferences(prevURLs: AssetURLs): AssetURLs {
        return {
          ...prevURLs,
          [assetId]: {
            ...prevURLs[assetId],
            references: prevURLs[assetId].references + 1,
          },
        };
      }

      function createReference(prevURLs: AssetURLs): AssetURLs {
        return {
          ...prevURLs,
          [assetId]: { url: null, id: assetId, references: 1 },
        };
      }
      setAssetURLs?.((prevURLs) => {
        if (assetId in prevURLs) {
          // Check if the asset url is already added and increase references
          return increaseReferences(prevURLs);
        } else {
          return createReference(prevURLs);
        }
      });
    }

    updateAssetURL();

    return () => {
      // Decrease references
      setAssetURLs((prevURLs) => {
        if (assetId in prevURLs) {
          return {
            ...prevURLs,
            [assetId]: {
              ...prevURLs[assetId],
              references: prevURLs[assetId].references - 1,
            },
          };
        } else {
          return prevURLs;
        }
      });
    };
  }, [assetId, setAssetURLs, type]);

  if (!assetId) {
    return unknownSource;
  }

  if (type === "default") {
    return defaultSources[assetId];
  }

  if (type === "file") {
    return assetURLs[assetId]?.url || unknownSource;
  }

  return unknownSource;
}

type FileData = {
  file: string;
  type: "file";
  thumbnail: string;
  quality?: string;
  resolutions?: Record<string, string>;
};

type DefaultData = {
  key: string;
  type: "default";
};

/**
 * Load a map or token into a URL taking into account a thumbnail and multiple resolutions
 */
export function useDataURL(
  data: FileData | DefaultData,
  defaultSources: Record<string, string>,
  unknownSource: string | undefined,
  thumbnail = false
) {
  const [assetId, setAssetId] = useState<string>();

  useEffect(() => {
    if (!data) {
      return;
    }
    function loadAssetId() {
      if (data.type === "default") {
        setAssetId(data.key);
      } else {
        if (thumbnail) {
          setAssetId(data.thumbnail);
        } else if (
          data.resolutions &&
          data.quality &&
          data.quality !== "original"
        ) {
          setAssetId(data.resolutions[data.quality]);
        } else {
          setAssetId(data.file);
        }
      }
    }

    loadAssetId();
  }, [data, thumbnail]);

  const assetURL = useAssetURL(
    assetId || "",
    data?.type,
    defaultSources,
    unknownSource
  );
  return assetURL;
}

export default AssetsContext;

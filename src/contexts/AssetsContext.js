import React, { useState, useContext, useCallback, useEffect } from "react";
import * as Comlink from "comlink";
import { encode } from "@msgpack/msgpack";
import { useLiveQuery } from "dexie-react-hooks";

import { useDatabase } from "./DatabaseContext";

import useDebounce from "../hooks/useDebounce";

import { omit } from "../helpers/shared";

/**
 * @typedef Asset
 * @property {string} id
 * @property {number} width
 * @property {number} height
 * @property {Uint8Array} file
 * @property {string} mime
 * @property {string} owner
 */

/**
 * @callback getAsset
 * @param {string} assetId
 * @returns {Promise<Asset|undefined>}
 */

/**
 * @callback addAssets
 * @param {Asset[]} assets
 */

/**
 * @callback putAsset
 * @param {Asset} asset
 */

/**
 * @typedef AssetsContext
 * @property {getAsset} getAsset
 * @property {addAssets} addAssets
 * @property {putAsset} putAsset
 */

/**
 * @type {React.Context<undefined|AssetsContext>}
 */
const AssetsContext = React.createContext();

// 100 MB max cache size
const maxCacheSize = 1e8;

export function AssetsProvider({ children }) {
  const { worker, database, databaseStatus } = useDatabase();

  useEffect(() => {
    if (databaseStatus === "loaded") {
      worker.cleanAssetCache(maxCacheSize);
    }
  }, [worker, databaseStatus]);

  const getAsset = useCallback(
    async (assetId) => {
      return await database.table("assets").get(assetId);
    },
    [database]
  );

  const addAssets = useCallback(
    async (assets) => {
      await database.table("assets").bulkAdd(assets);
    },
    [database]
  );

  const putAsset = useCallback(
    async (asset) => {
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

/**
 * @type React.Context<undefined|Object.<string, AssetURL>>
 */
export const AssetURLsStateContext = React.createContext();

/**
 * @type React.Context<undefined|React.Dispatch<React.SetStateAction<{}>>>
 */
export const AssetURLsUpdaterContext = React.createContext();

/**
 * Helper to manage sharing of custom image sources between uses of useAssetURL
 */
export function AssetURLsProvider({ children }) {
  const [assetURLs, setAssetURLs] = useState({});
  const { database } = useDatabase();

  // Keep track of the assets that need to be loaded
  const [assetKeys, setAssetKeys] = useState([]);

  // Load assets after 100ms
  const loadingDebouncedAssetURLs = useDebounce(assetURLs, 100);

  // Update the asset keys to load when a url is added without an asset attached
  useEffect(() => {
    if (!loadingDebouncedAssetURLs) {
      return;
    }
    let keysToLoad = [];
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
  const assets = useLiveQuery(
    () => database?.table("assets").bulkGet(assetKeys),
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
        if (asset && newURLs[asset.id]?.url === null) {
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
          URL.revokeObjectURL(url.url);
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
 * @param {string} assetId
 * @param {"file"|"default"} type
 * @param {Object.<string, string>} defaultSources
 * @param {string|undefined} unknownSource
 * @returns {string|undefined}
 */
export function useAssetURL(assetId, type, defaultSources, unknownSource) {
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
      function increaseReferences(prevURLs) {
        return {
          ...prevURLs,
          [assetId]: {
            ...prevURLs[assetId],
            references: prevURLs[assetId].references + 1,
          },
        };
      }

      function createReference(prevURLs) {
        return {
          ...prevURLs,
          [assetId]: { url: null, id: assetId, references: 1 },
        };
      }
      setAssetURLs((prevURLs) => {
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

/**
 * @typedef FileData
 * @property {string} file
 * @property {"file"} type
 * @property {string} thumbnail
 * @property {string=} quality
 * @property {Object.<string, string>=} resolutions
 */

/**
 * @typedef DefaultData
 * @property {string} key
 * @property {"default"} type
 */

/**
 * Load a map or token into a URL taking into account a thumbnail and multiple resolutions
 * @param {FileData|DefaultData} data
 * @param {Object.<string, string>} defaultSources
 * @param {string|undefined} unknownSource
 * @param {boolean} thumbnail
 * @returns {string|undefined}
 */
export function useDataURL(
  data,
  defaultSources,
  unknownSource,
  thumbnail = false
) {
  const [assetId, setAssetId] = useState();

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
        } else if (data.resolutions && data.quality !== "original") {
          setAssetId(data.resolutions[data.quality]);
        } else {
          setAssetId(data.file);
        }
      }
    }

    loadAssetId();
  }, [data, thumbnail]);

  const assetURL = useAssetURL(
    assetId,
    data?.type,
    defaultSources,
    unknownSource
  );
  return assetURL;
}

export default AssetsContext;

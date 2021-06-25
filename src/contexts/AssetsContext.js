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
      // Attempt to use worker to put map to avoid UI lockup
      const packedAsset = encode(asset);
      const success = await worker.putData(
        Comlink.transfer(packedAsset, [packedAsset.buffer]),
        "assets"
      );
      if (!success) {
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

  // Keep track of when the asset keys change so we can update the URLs
  const [assetKeys, setAssetKeys] = useState([]);
  useEffect(() => {
    const keys = Object.keys(assetURLs);
    let newKeys = keys.filter((key) => !assetKeys.includes(key));
    let deletedKeys = assetKeys.filter((key) => !keys.includes(key));
    if (newKeys.length > 0 || deletedKeys.length > 0) {
      setAssetKeys((prevKeys) =>
        [...prevKeys, ...newKeys].filter((key) => !deletedKeys.includes(key))
      );
    }
  }, [assetURLs, assetKeys]);

  // Get the new assets whenever the keys change
  const assets = useLiveQuery(
    () => database?.table("assets").where("id").anyOf(assetKeys).toArray(),
    [database, assetKeys]
  );

  // Update asset URLs when assets are loaded
  useEffect(() => {
    if (!assets) {
      return;
    }
    setAssetURLs((prevURLs) => {
      let newURLs = { ...prevURLs };
      for (let asset of assets) {
        if (newURLs[asset.id].url === null) {
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
  const debouncedAssetURLs = useDebounce(assetURLs, 60 * 1000);

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
  }, [debouncedAssetURLs]);

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

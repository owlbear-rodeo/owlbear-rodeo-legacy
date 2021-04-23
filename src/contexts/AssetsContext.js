import React, { useState, useContext, useCallback, useEffect } from "react";
import { decode } from "@msgpack/msgpack";

import { useDatabase } from "./DatabaseContext";

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

export function AssetsProvider({ children }) {
  const { worker, database } = useDatabase();

  const getAsset = useCallback(
    async (assetId) => {
      const packed = await worker.loadData("assets", assetId);
      return decode(packed);
    },
    [worker]
  );

  const addAssets = useCallback(
    async (assets) => {
      return database.table("assets").bulkAdd(assets);
    },
    [database]
  );

  const putAsset = useCallback(
    async (asset) => {
      return database.table("assets").put(asset);
    },
    [database]
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

  // Revoke url when no more references
  useEffect(() => {
    let urlsToCleanup = [];
    for (let url of Object.values(assetURLs)) {
      if (url.references <= 0) {
        URL.revokeObjectURL(url.url);
        urlsToCleanup.push(url.id);
      }
    }
    if (urlsToCleanup.length > 0) {
      setAssetURLs((prevURLs) => omit(prevURLs, urlsToCleanup));
    }
  }, [assetURLs]);

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

  const { getAsset } = useAssets();

  useEffect(() => {
    if (!assetId || type !== "file") {
      return;
    }

    async function updateAssetURL() {
      const asset = await getAsset(assetId);
      if (asset) {
        setAssetURLs((prevURLs) => {
          if (assetId in prevURLs) {
            // Check if the asset url is already added
            return {
              ...prevURLs,
              [assetId]: {
                ...prevURLs[assetId],
                // Increase references
                references: prevURLs[assetId].references + 1,
              },
            };
          } else {
            const url = URL.createObjectURL(
              new Blob([asset.file], { type: asset.mime })
            );
            return {
              ...prevURLs,
              [assetId]: { url, id: assetId, references: 1 },
            };
          }
        });
      }
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
  }, [assetId, setAssetURLs, getAsset, type]);

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

const dataResolutions = ["ultra", "high", "medium", "low"];

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
  const { database } = useDatabase();
  const [assetId, setAssetId] = useState();

  useEffect(() => {
    if (!data) {
      return;
    }
    async function loastAssetId() {
      if (data.type === "default") {
        setAssetId(data.key);
      } else {
        if (thumbnail) {
          setAssetId(data.thumbnail);
        } else if (data.resolutions) {
          const fileKeys = await database
            .table("assets")
            .where("id")
            .equals(data.file)
            .primaryKeys();
          const fileExists = fileKeys.length > 0;
          // Check if a resolution is specified
          if (data.quality && data.resolutions[data.quality]) {
            setAssetId(data.resolutions[data.quality]);
          }
          // If no file available fallback to the highest resolution
          else if (!fileExists) {
            for (let res of dataResolutions) {
              if (res in data.resolutions) {
                setAssetId(data.resolutions[res]);
                break;
              }
            }
          } else {
            setAssetId(data.file);
          }
        } else {
          setAssetId(data.file);
        }
      }
    }

    loastAssetId();
  }, [data, thumbnail, database]);

  const type = data?.type || "default";

  const assetURL = useAssetURL(assetId, type, defaultSources, unknownSource);
  return assetURL;
}

export default AssetsContext;

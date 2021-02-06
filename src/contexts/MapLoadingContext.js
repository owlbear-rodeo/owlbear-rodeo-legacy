import React, { useState, useRef, useContext } from "react";
import { omit, isEmpty } from "../helpers/shared";

const MapLoadingContext = React.createContext();

export function MapLoadingProvider({ children }) {
  const [loadingAssetCount, setLoadingAssetCount] = useState(0);

  function assetLoadStart() {
    setLoadingAssetCount((prevLoadingAssets) => prevLoadingAssets + 1);
  }

  function assetLoadFinish() {
    setLoadingAssetCount((prevLoadingAssets) => prevLoadingAssets - 1);
  }

  const assetProgressRef = useRef({});
  const loadingProgressRef = useRef(null);
  function assetProgressUpdate({ id, count, total }) {
    if (count === total) {
      assetProgressRef.current = omit(assetProgressRef.current, [id]);
    } else {
      assetProgressRef.current = {
        ...assetProgressRef.current,
        [id]: { count, total },
      };
    }
    if (!isEmpty(assetProgressRef.current)) {
      let total = 0;
      let count = 0;
      for (let progress of Object.values(assetProgressRef.current)) {
        total += progress.total;
        count += progress.count;
      }
      loadingProgressRef.current = count / total;
    }
  }

  const isLoading = loadingAssetCount > 0;

  const value = {
    assetLoadStart,
    assetLoadFinish,
    isLoading,
    assetProgressUpdate,
    loadingProgressRef,
  };

  return (
    <MapLoadingContext.Provider value={value}>
      {children}
    </MapLoadingContext.Provider>
  );
}

export function useMapLoading() {
  const context = useContext(MapLoadingContext);
  if (context === undefined) {
    throw new Error("useMapLoading must be used within a MapLoadingProvider");
  }
  return context;
}

export default MapLoadingContext;

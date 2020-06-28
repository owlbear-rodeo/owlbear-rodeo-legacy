import React, { useState } from "react";
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

  const [assetProgress, setAssetProgress] = useState({});
  function assetProgressUpdate({ id, count, total }) {
    if (count === total) {
      setAssetProgress(omit(assetProgress, [id]));
    } else {
      setAssetProgress((prevAssetProgress) => ({
        ...prevAssetProgress,
        [id]: { count, total },
      }));
    }
  }

  const isLoading = loadingAssetCount > 0;
  let loadingProgress = null;
  if (!isEmpty(assetProgress)) {
    let total = 0;
    let count = 0;
    for (let progress of Object.values(assetProgress)) {
      total += progress.total;
      count += progress.count;
    }
    loadingProgress = count / total;
  }

  const value = {
    assetLoadStart,
    assetLoadFinish,
    isLoading,
    assetProgressUpdate,
    loadingProgress,
  };

  return (
    <MapLoadingContext.Provider value={value}>
      {children}
    </MapLoadingContext.Provider>
  );
}

export default MapLoadingContext;

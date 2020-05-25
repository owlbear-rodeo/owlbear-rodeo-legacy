import React, { useState } from "react";

const MapLoadingContext = React.createContext();

export function MapLoadingProvider({ children }) {
  const [loadingAssetCount, setLoadingAssetCount] = useState(0);

  function assetLoadStart() {
    setLoadingAssetCount((prevLoadingAssets) => prevLoadingAssets + 1);
  }

  function assetLoadFinish() {
    setLoadingAssetCount((prevLoadingAssets) => prevLoadingAssets - 1);
  }

  const isLoading = loadingAssetCount > 0;

  const value = {
    assetLoadStart,
    assetLoadFinish,
    isLoading,
  };

  return (
    <MapLoadingContext.Provider value={value}>
      {children}
    </MapLoadingContext.Provider>
  );
}

export default MapLoadingContext;

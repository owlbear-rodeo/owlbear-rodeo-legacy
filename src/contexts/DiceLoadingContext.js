import React, { useState } from "react";

const DiceLoadingContext = React.createContext();

export function DiceLoadingProvider({ children }) {
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
    <DiceLoadingContext.Provider value={value}>
      {children}
    </DiceLoadingContext.Provider>
  );
}

export default DiceLoadingContext;

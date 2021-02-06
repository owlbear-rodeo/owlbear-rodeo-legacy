import React, { useState, useContext } from "react";

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

export function useDiceLoading() {
  const context = useContext(DiceLoadingContext);
  if (context === undefined) {
    throw new Error("useDiceLoading must be used within a DiceLoadingProvider");
  }
  return context;
}

export default DiceLoadingContext;

import React, { useState, useContext, ReactChild } from "react";

type DiceLoadingContext = {
  assetLoadStart: any,
  assetLoadFinish: any,
  isLoading: boolean,
}

const DiceLoadingContext = React.createContext<DiceLoadingContext | undefined>(undefined);

export function DiceLoadingProvider({ children }: { children: ReactChild }) {
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

export function useDiceLoading(): DiceLoadingContext {
  const context = useContext(DiceLoadingContext);
  if (context === undefined) {
    throw new Error("useDiceLoading must be used within a DiceLoadingProvider");
  }
  return context;
}

export default DiceLoadingContext;

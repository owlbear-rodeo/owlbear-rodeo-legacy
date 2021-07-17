import React, { useState, useContext, ReactChild } from "react";

export type AssetLoadStartEventHandler = () => void;
export type AssetLoadFinishEventHandler = () => void;

type DiceLoadingContextValue = {
  assetLoadStart: AssetLoadStartEventHandler;
  assetLoadFinish: AssetLoadFinishEventHandler;
  isLoading: boolean;
};

const DiceLoadingContext =
  React.createContext<DiceLoadingContextValue | undefined>(undefined);

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

export function useDiceLoading() {
  const context = useContext(DiceLoadingContext);
  if (context === undefined) {
    throw new Error("useDiceLoading must be used within a DiceLoadingProvider");
  }
  return context;
}

export default DiceLoadingContext;

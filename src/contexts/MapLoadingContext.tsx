import React, { useState, useRef, useContext, useCallback } from "react";

type MapLoadingProgress = {
  count: number;
  total: number;
};

type MapLoadingProgressUpdate = MapLoadingProgress & {
  id: string;
};

type MapLoadingContext = {
  isLoading: boolean;
  assetLoadStart: (id: string) => void;
  assetProgressUpdate: (update: MapLoadingProgressUpdate) => void;
  loadingProgressRef: React.MutableRefObject<number>;
};

const MapLoadingContext =
  React.createContext<MapLoadingContext | undefined>(undefined);

export function MapLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  // Mapping from asset id to the count and total number of pieces loaded
  const assetProgressRef = useRef<Record<string, MapLoadingProgress>>({});
  // Loading progress of all assets between 0 and 1
  const loadingProgressRef = useRef<number>(0);

  const assetLoadStart = useCallback((id) => {
    setIsLoading(true);
    // Add asset at a 0% progress
    assetProgressRef.current = {
      ...assetProgressRef.current,
      [id]: { count: 0, total: 1 },
    };
  }, []);

  const assetProgressUpdate = useCallback(({ id, count, total }) => {
    assetProgressRef.current = {
      ...assetProgressRef.current,
      [id]: { count, total },
    };
    // Update loading progress
    let complete = 0;
    const progresses = Object.values(assetProgressRef.current);
    for (let progress of progresses) {
      complete += progress.count / progress.total;
    }
    loadingProgressRef.current = complete / progresses.length;
    // All loading is complete
    if (loadingProgressRef.current === 1) {
      setIsLoading(false);
      assetProgressRef.current = {};
    }
  }, []);

  const value = {
    assetLoadStart,
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

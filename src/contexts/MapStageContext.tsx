import React, { useContext } from "react";
import { Stage } from "konva/types/Stage";

export type MapStage = React.MutableRefObject<Stage | null>;

const MapStageContext = React.createContext<MapStage | undefined>(undefined);
export const MapStageProvider = MapStageContext.Provider;

export function useMapStage() {
  const context = useContext(MapStageContext);
  if (context === undefined) {
    throw new Error("useMapStage must be used within a MapStageProvider");
  }
  return context;
}

export default MapStageContext;

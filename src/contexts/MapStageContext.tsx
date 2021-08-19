import React, { useContext } from "react";
import Konva from "konva";

export type MapStage = React.MutableRefObject<Konva.Stage | null>;

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

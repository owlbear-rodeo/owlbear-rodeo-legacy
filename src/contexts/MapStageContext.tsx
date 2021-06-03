import React, { useContext } from "react";

const MapStageContext = React.createContext({
  mapStageRef: { current: null },
});
export const MapStageProvider: any = MapStageContext.Provider;

export function useMapStage() {
  const context = useContext(MapStageContext);
  if (context === undefined) {
    throw new Error("useMapStage must be used within a MapStageProvider");
  }
  return context;
}

export default MapStageContext;

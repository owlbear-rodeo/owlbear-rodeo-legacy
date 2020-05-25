import React from "react";

const MapStageContext = React.createContext({
  mapStageRef: { current: null },
});
export const MapStageProvider = MapStageContext.Provider;

export default MapStageContext;

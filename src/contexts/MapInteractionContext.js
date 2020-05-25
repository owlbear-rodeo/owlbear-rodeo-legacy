import React from "react";

const MapInteractionContext = React.createContext({
  stageScale: 1,
  stageWidth: 1,
  stageHeight: 1,
  setPreventMapInteraction: () => {},
  mapWidth: 1,
  mapHeight: 1,
});
export const MapInteractionProvider = MapInteractionContext.Provider;

export default MapInteractionContext;

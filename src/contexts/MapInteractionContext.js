import React from "react";

const MapInteractionContext = React.createContext({
  stageScale: 1,
  stageWidth: 1,
  stageHeight: 1,
  stageDragState: "none",
  setPreventMapInteraction: () => {},
  mapWidth: 1,
  mapHeight: 1,
  mapDragPositionRef: { current: undefined },
});
export const MapInteractionProvider = MapInteractionContext.Provider;

export default MapInteractionContext;

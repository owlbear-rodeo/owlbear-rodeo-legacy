import React, { useContext } from "react";

const MapInteractionContext = React.createContext({
  stageScale: 1,
  stageWidth: 1,
  stageHeight: 1,
  setPreventMapInteraction: () => {},
  mapWidth: 1,
  mapHeight: 1,
  interactionEmitter: null,
});
export const MapInteractionProvider = MapInteractionContext.Provider;

export function useMapInteraction() {
  const context = useContext(MapInteractionContext);
  if (context === undefined) {
    throw new Error(
      "useMapInteraction must be used within a MapInteractionProvider"
    );
  }
  return context;
}

export default MapInteractionContext;

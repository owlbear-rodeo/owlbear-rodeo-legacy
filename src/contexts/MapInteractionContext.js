import React from "react";

const MapInteractionContext = React.createContext({
  translateRef: null,
  scaleRef: null,
});
export const MapInteractionProvider = MapInteractionContext.Provider;

export default MapInteractionContext;

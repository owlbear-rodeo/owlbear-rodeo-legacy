import React, { useContext } from "react";
import useDebounce from "../hooks/useDebounce";

export const StageScaleContext = React.createContext();
export const DebouncedStageScaleContext = React.createContext();
export const StageWidthContext = React.createContext();
export const StageHeightContext = React.createContext();
export const SetPreventMapInteractionContext = React.createContext();
export const MapWidthContext = React.createContext();
export const MapHeightContext = React.createContext();
export const InteractionEmitterContext = React.createContext();

export function MapInteractionProvider({ value, children }) {
  const {
    stageScale,
    stageWidth,
    stageHeight,
    setPreventMapInteraction,
    mapWidth,
    mapHeight,
    interactionEmitter,
  } = value;
  const debouncedStageScale = useDebounce(stageScale, 200);
  return (
    <InteractionEmitterContext.Provider value={interactionEmitter}>
      <SetPreventMapInteractionContext.Provider
        value={setPreventMapInteraction}
      >
        <StageWidthContext.Provider value={stageWidth}>
          <StageHeightContext.Provider value={stageHeight}>
            <MapWidthContext.Provider value={mapWidth}>
              <MapHeightContext.Provider value={mapHeight}>
                <StageScaleContext.Provider value={stageScale}>
                  <DebouncedStageScaleContext.Provider
                    value={debouncedStageScale || 1}
                  >
                    {children}
                  </DebouncedStageScaleContext.Provider>
                </StageScaleContext.Provider>
              </MapHeightContext.Provider>
            </MapWidthContext.Provider>
          </StageHeightContext.Provider>
        </StageWidthContext.Provider>
      </SetPreventMapInteractionContext.Provider>
    </InteractionEmitterContext.Provider>
  );
}

export function useInteractionEmitter() {
  const context = useContext(InteractionEmitterContext);
  if (context === undefined) {
    throw new Error(
      "useInteractionEmitter must be used within a MapInteractionProvider"
    );
  }
  return context;
}

export function useSetPreventMapInteraction() {
  const context = useContext(SetPreventMapInteractionContext);
  if (context === undefined) {
    throw new Error(
      "useSetPreventMapInteraction must be used within a MapInteractionProvider"
    );
  }
  return context;
}

export function useStageWidth() {
  const context = useContext(StageWidthContext);
  if (context === undefined) {
    throw new Error(
      "useStageWidth must be used within a MapInteractionProvider"
    );
  }
  return context;
}

export function useStageHeight() {
  const context = useContext(StageHeightContext);
  if (context === undefined) {
    throw new Error(
      "useStageHeight must be used within a MapInteractionProvider"
    );
  }
  return context;
}

export function useMapWidth() {
  const context = useContext(MapWidthContext);
  if (context === undefined) {
    throw new Error("useMapWidth must be used within a MapInteractionProvider");
  }
  return context;
}

export function useMapHeight() {
  const context = useContext(MapHeightContext);
  if (context === undefined) {
    throw new Error(
      "useMapHeight must be used within a MapInteractionProvider"
    );
  }
  return context;
}

export function useStageScale() {
  const context = useContext(StageScaleContext);
  if (context === undefined) {
    throw new Error(
      "useStageScale must be used within a MapInteractionProvider"
    );
  }
  return context;
}

export function useDebouncedStageScale() {
  const context = useContext(DebouncedStageScaleContext);
  if (context === undefined) {
    throw new Error(
      "useDebouncedStageScale must be used within a MapInteractionProvider"
    );
  }
  return context;
}

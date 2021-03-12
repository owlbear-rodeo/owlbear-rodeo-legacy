import React, { useContext } from "react";
import useDebounce from "../hooks/useDebounce";

const StageScaleContext = React.createContext();
const DebouncedStageScaleContext = React.createContext();
const StageWidthContext = React.createContext();
const StageHeightContext = React.createContext();
const SetPreventMapInteractionContext = React.createContext();
const MapWidthContext = React.createContext();
const MapHeightContext = React.createContext();
const InteractionEmitterContext = React.createContext();

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
                    value={debouncedStageScale}
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

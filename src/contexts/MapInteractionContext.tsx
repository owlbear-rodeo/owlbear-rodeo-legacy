import React, { useContext } from "react";
import { FullGestureState } from "react-use-gesture/dist/types";
import useDebounce from "../hooks/useDebounce";
import { TypedEmitter } from "tiny-typed-emitter";

export type MapDragEvent = Omit<FullGestureState<"drag">, "event"> & {
  event: React.PointerEvent<Element> | PointerEvent;
};

export type MapDragEventHandler = (props: MapDragEvent) => void;

export interface MapInteractionEvents {
  dragStart: MapDragEventHandler;
  drag: MapDragEventHandler;
  dragEnd: MapDragEventHandler;
}

export class MapInteractionEmitter extends TypedEmitter<MapInteractionEvents> {}

type MapInteraction = {
  stageScale: number;
  stageWidth: number;
  stageHeight: number;
  setPreventMapInteraction: React.Dispatch<React.SetStateAction<boolean>>;
  mapWidth: number;
  mapHeight: number;
  interactionEmitter: MapInteractionEmitter | null;
};

export const StageScaleContext = React.createContext<
  MapInteraction["stageScale"] | undefined
>(undefined);
export const DebouncedStageScaleContext = React.createContext<
  MapInteraction["stageScale"] | undefined
>(undefined);
export const StageWidthContext = React.createContext<
  MapInteraction["stageWidth"] | undefined
>(undefined);
export const StageHeightContext = React.createContext<
  MapInteraction["stageHeight"] | undefined
>(undefined);
export const SetPreventMapInteractionContext = React.createContext<
  MapInteraction["setPreventMapInteraction"] | undefined
>(undefined);
export const MapWidthContext = React.createContext<
  MapInteraction["mapWidth"] | undefined
>(undefined);
export const MapHeightContext = React.createContext<
  MapInteraction["mapHeight"] | undefined
>(undefined);
export const InteractionEmitterContext = React.createContext<
  MapInteraction["interactionEmitter"] | undefined
>(undefined);

export function MapInteractionProvider({
  value,
  children,
}: {
  value: MapInteraction;
  children: React.ReactNode;
}) {
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

export function leftMouseButton(event: MapDragEvent) {
  return event.buttons <= 1;
}

export function middleMouseButton(event: MapDragEvent) {
  return event.buttons === 4;
}

export function rightMouseButton(event: MapDragEvent) {
  return event.buttons === 2;
}

import { useContext, useRef, useEffect } from "react";

import MapInteractionContext from "../contexts/MapInteractionContext";

import { compare } from "./vector2";

import usePrevious from "./usePrevious";

/**
 * @callback onBrushUpdate
 * @param {string} drawState "first" | "drawing" | "last"
 * @param {Object} brushPosition the normalized x and y coordinates of the brush on the map
 */

/**
 * Helper to get the maps drag position as it changes
 * @param {boolean} shouldUpdate
 * @param {onBrushUpdate} onBrushUpdate
 */
function useMapBrush(shouldUpdate, onBrushUpdate) {
  const { stageDragState, mapDragPositionRef } = useContext(
    MapInteractionContext
  );

  const requestRef = useRef();
  const previousDragState = usePrevious(stageDragState);
  const previousBrushPositionRef = useRef(mapDragPositionRef.current);

  useEffect(() => {
    function updateBrush(forceUpdate) {
      const drawState =
        stageDragState === "dragging" ? "drawing" : stageDragState;
      const brushPosition = mapDragPositionRef.current;
      const previousBrushPostition = previousBrushPositionRef.current;
      // Only update brush when it has moved
      if (
        !compare(brushPosition, previousBrushPostition, 0.0001) ||
        forceUpdate
      ) {
        onBrushUpdate(drawState, brushPosition);
        previousBrushPositionRef.current = brushPosition;
      }
    }

    function animate() {
      if (!shouldUpdate) {
        return;
      }
      requestRef.current = requestAnimationFrame(animate);
      updateBrush(false);
    }

    requestRef.current = requestAnimationFrame(animate);

    if (stageDragState !== previousDragState && shouldUpdate) {
      updateBrush(true);
    }

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [
    shouldUpdate,
    onBrushUpdate,
    stageDragState,
    mapDragPositionRef,
    previousDragState,
  ]);
}

export default useMapBrush;

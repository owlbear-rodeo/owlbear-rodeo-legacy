import React, { useContext, useEffect } from "react";
import { Group } from "react-konva";

import MapInteractionContext from "../../contexts/MapInteractionContext";
import MapStageContext from "../../contexts/MapStageContext";

import { getStrokeWidth } from "../../helpers/drawing";
import {
  getRelativePointerPositionNormalized,
  Trail,
} from "../../helpers/konva";
import { multiply } from "../../helpers/vector2";

import colors from "../../helpers/colors";

function MapPointer({
  gridSize,
  active,
  position,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  visible,
}) {
  const { mapWidth, mapHeight, interactionEmitter } = useContext(
    MapInteractionContext
  );
  const mapStageRef = useContext(MapStageContext);

  useEffect(() => {
    if (!active) {
      return;
    }

    const mapStage = mapStageRef.current;

    function getBrushPosition() {
      const mapImage = mapStage.findOne("#mapImage");
      return getRelativePointerPositionNormalized(mapImage);
    }

    function handleBrushDown() {
      onPointerDown && onPointerDown(getBrushPosition());
    }

    function handleBrushMove() {
      onPointerMove && onPointerMove(getBrushPosition());
    }

    function handleBrushUp() {
      onPointerMove && onPointerUp(getBrushPosition());
    }

    interactionEmitter.on("dragStart", handleBrushDown);
    interactionEmitter.on("drag", handleBrushMove);
    interactionEmitter.on("dragEnd", handleBrushUp);

    return () => {
      interactionEmitter.off("dragStart", handleBrushDown);
      interactionEmitter.off("drag", handleBrushMove);
      interactionEmitter.off("dragEnd", handleBrushUp);
    };
  });

  const size = getStrokeWidth(2, gridSize, mapWidth, mapHeight);

  return (
    <Group>
      {visible && (
        <Trail
          position={multiply(position, { x: mapWidth, y: mapHeight })}
          color={colors.red}
          size={size}
          duration={200}
        />
      )}
    </Group>
  );
}

export default MapPointer;

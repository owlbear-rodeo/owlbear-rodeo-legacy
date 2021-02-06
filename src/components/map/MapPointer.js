import React, { useEffect } from "react";
import { Group } from "react-konva";

import { useMapInteraction } from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import { useGrid } from "../../contexts/GridContext";

import {
  getRelativePointerPositionNormalized,
  Trail,
} from "../../helpers/konva";
import Vector2 from "../../helpers/Vector2";

import colors from "../../helpers/colors";

function MapPointer({
  active,
  position,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  visible,
  color,
}) {
  const { mapWidth, mapHeight, interactionEmitter } = useMapInteraction();
  const { gridStrokeWidth } = useGrid();
  const mapStageRef = useMapStage();

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
      onPointerMove && visible && onPointerMove(getBrushPosition());
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

  const size = 2 * gridStrokeWidth;

  return (
    <Group>
      {visible && (
        <Trail
          position={Vector2.multiply(position, { x: mapWidth, y: mapHeight })}
          color={colors[color]}
          size={size}
          duration={200}
        />
      )}
    </Group>
  );
}

MapPointer.defaultProps = {
  color: "red",
};

export default MapPointer;

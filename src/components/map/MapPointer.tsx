import { useEffect } from "react";
import { Group } from "react-konva";

import {
  useMapWidth,
  useMapHeight,
  useInteractionEmitter,
} from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import { useGridStrokeWidth } from "../../contexts/GridContext";

import {
  getRelativePointerPositionNormalized,
  Trail,
} from "../../helpers/konva";
import Vector2 from "../../helpers/Vector2";

import colors, { Color } from "../../helpers/colors";

type MapPointerProps = {
  active: boolean;
  position: Vector2;
  onPointerDown?: (position: Vector2) => void;
  onPointerMove?: (position: Vector2) => void;
  onPointerUp?: (position: Vector2) => void;
  visible: boolean;
  color: Color;
};

function MapPointer({
  active,
  position,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  visible,
  color,
}: MapPointerProps) {
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const interactionEmitter = useInteractionEmitter();
  const gridStrokeWidth = useGridStrokeWidth();
  const mapStageRef = useMapStage();

  useEffect(() => {
    if (!active) {
      return;
    }

    const mapStage = mapStageRef.current;

    function getBrushPosition() {
      if (!mapStage) {
        return;
      }
      const mapImage = mapStage.findOne("#mapImage");
      return getRelativePointerPositionNormalized(mapImage);
    }

    function handleBrushDown() {
      const brushPosition = getBrushPosition();
      brushPosition && onPointerDown?.(brushPosition);
    }

    function handleBrushMove() {
      const brushPosition = getBrushPosition();
      brushPosition && visible && onPointerMove?.(brushPosition);
    }

    function handleBrushUp() {
      const brushPosition = getBrushPosition();
      brushPosition && onPointerUp?.(brushPosition);
    }

    interactionEmitter?.on("dragStart", handleBrushDown);
    interactionEmitter?.on("drag", handleBrushMove);
    interactionEmitter?.on("dragEnd", handleBrushUp);

    return () => {
      interactionEmitter?.off("dragStart", handleBrushDown);
      interactionEmitter?.off("drag", handleBrushMove);
      interactionEmitter?.off("dragEnd", handleBrushUp);
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

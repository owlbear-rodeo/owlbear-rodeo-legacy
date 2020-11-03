import React, { useContext, useState, useEffect } from "react";
import { Group, Rect } from "react-konva";

import MapInteractionContext from "../../contexts/MapInteractionContext";
import MapStageContext from "../../contexts/MapStageContext";

import { getBrushPositionForTool } from "../../helpers/drawing";
import { getRelativePointerPositionNormalized } from "../../helpers/konva";

const defaultNoteSize = 2;

function MapNotes({ map, selectedToolSettings, active, gridSize }) {
  const { mapWidth, mapHeight, interactionEmitter } = useContext(
    MapInteractionContext
  );
  const mapStageRef = useContext(MapStageContext);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [brushPosition, setBrushPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!active) {
      return;
    }
    const mapStage = mapStageRef.current;

    function getBrushPosition() {
      const mapImage = mapStage.findOne("#mapImage");
      return getBrushPositionForTool(
        map,
        getRelativePointerPositionNormalized(mapImage),
        map.snapToGrid,
        false,
        gridSize,
        []
      );
    }

    function handleBrushDown() {
      setBrushPosition(getBrushPosition());
      setIsBrushDown(true);
    }

    function handleBrushMove() {
      setBrushPosition(getBrushPosition());
      setIsBrushDown(true);
    }

    function handleBrushUp() {
      setBrushPosition({ x: 0, y: 0 });
      setIsBrushDown(false);
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

  const noteWidth = map && (mapWidth / map.grid.size.x) * defaultNoteSize;
  const noteHeight = map && (mapHeight / map.grid.size.y) * defaultNoteSize;

  return (
    <Group>
      {isBrushDown && (
        <Rect
          x={brushPosition.x * mapWidth}
          y={brushPosition.y * mapHeight}
          width={noteWidth}
          height={noteHeight}
          offsetX={noteWidth / 2}
          offsetY={noteHeight / 2}
          fill="white"
          shadowColor="rgba(0, 0, 0, 0.16)"
          shadowOffset={{ x: 0, y: 3 }}
          shadowBlur={6}
        />
      )}
    </Group>
  );
}

export default MapNotes;

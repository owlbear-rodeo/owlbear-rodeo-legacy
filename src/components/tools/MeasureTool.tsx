import { useState, useEffect } from "react";
import { Group } from "react-konva";

import {
  useInteractionEmitter,
  MapDragEvent,
  leftMouseButton,
} from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import {
  useGrid,
  useGridCellPixelSize,
  useGridCellNormalizedSize,
  useGridOffset,
} from "../../contexts/GridContext";

import {
  getDefaultShapeData,
  getUpdatedShapeData,
} from "../../helpers/drawing";
import Vector2 from "../../helpers/Vector2";
import { getRelativePointerPosition } from "../../helpers/konva";
import { parseGridScale, gridDistance } from "../../helpers/grid";

import Ruler from "../konva/Ruler";

import useGridSnapping from "../../hooks/useGridSnapping";
import { Map } from "../../types/Map";
import { PointsData } from "../../types/Drawing";

type MapMeasureProps = {
  map: Map | null;
  active: boolean;
};

type MeasureData = { length: number; points: Vector2[] };

function MeasureTool({ map, active }: MapMeasureProps) {
  const interactionEmitter = useInteractionEmitter();

  const grid = useGrid();
  const gridCellNormalizedSize = useGridCellNormalizedSize();
  const gridCellPixelSize = useGridCellPixelSize();
  const gridOffset = useGridOffset();

  const mapStageRef = useMapStage();
  const [drawingShapeData, setDrawingShapeData] = useState<MeasureData | null>(
    null
  );
  const [isBrushDown, setIsBrushDown] = useState(false);

  const gridScale = parseGridScale(active ? grid.measurement.scale : null);

  const snapPositionToGrid = useGridSnapping(
    grid.measurement.type === "euclidean" ? 0 : 1,
    false
  );

  useEffect(() => {
    if (!active) {
      return;
    }
    const mapStage = mapStageRef.current;
    const mapImage = mapStage?.findOne("#mapImage");

    function getBrushPosition() {
      if (!mapImage) {
        return;
      }
      let position = getRelativePointerPosition(mapImage);
      if (!position) {
        return;
      }
      if (map?.snapToGrid) {
        position = snapPositionToGrid(position);
      }
      return Vector2.divide(position, {
        x: mapImage.width(),
        y: mapImage.height(),
      });
    }

    function handleBrushDown(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      const brushPosition = getBrushPosition();
      if (!brushPosition) {
        return;
      }
      const { points } = getDefaultShapeData(
        "line",
        brushPosition
      ) as PointsData;
      const length = 0;
      setDrawingShapeData({ length, points });
      setIsBrushDown(true);
    }

    function handleBrushMove(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      const brushPosition = getBrushPosition();
      if (isBrushDown && drawingShapeData && brushPosition && mapImage) {
        const { points } = getUpdatedShapeData(
          "line",
          drawingShapeData,
          brushPosition,
          gridCellNormalizedSize,
          1,
          1
        ) as PointsData;
        // Convert back to pixel values
        const a = Vector2.subtract(
          Vector2.multiply(points[0], {
            x: mapImage.width(),
            y: mapImage.height(),
          }),
          gridOffset
        );
        const b = Vector2.subtract(
          Vector2.multiply(points[1], {
            x: mapImage.width(),
            y: mapImage.height(),
          }),
          gridOffset
        );
        const length = gridDistance(grid, a, b, gridCellPixelSize);
        setDrawingShapeData({
          length,
          points,
        });
      }
    }

    function handleBrushUp(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      setDrawingShapeData(null);
      setIsBrushDown(false);
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

  return (
    <Group>
      {drawingShapeData && (
        <Ruler
          points={drawingShapeData.points}
          scale={gridScale}
          length={drawingShapeData.length}
        />
      )}
    </Group>
  );
}

export default MeasureTool;

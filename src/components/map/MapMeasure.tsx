import { useState, useEffect } from "react";
import { Group, Line, Text, Label, Tag } from "react-konva";

import {
  useDebouncedStageScale,
  useMapWidth,
  useMapHeight,
  useInteractionEmitter,
} from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import {
  useGrid,
  useGridCellPixelSize,
  useGridCellNormalizedSize,
  useGridStrokeWidth,
  useGridOffset,
} from "../../contexts/GridContext";

import {
  getDefaultShapeData,
  getUpdatedShapeData,
} from "../../helpers/drawing";
import Vector2 from "../../helpers/Vector2";
import { getRelativePointerPosition } from "../../helpers/konva";
import { parseGridScale, gridDistance } from "../../helpers/grid";

import useGridSnapping from "../../hooks/useGridSnapping";
import { Map } from "../../types/Map";
import { PointsData } from "../../types/Drawing";

type MapMeasureProps = {
  map: Map;
  active: boolean;
};

type MeasureData = { length: number; points: Vector2[] };

function MapMeasure({ map, active }: MapMeasureProps) {
  const stageScale = useDebouncedStageScale();
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const interactionEmitter = useInteractionEmitter();

  const grid = useGrid();
  const gridCellNormalizedSize = useGridCellNormalizedSize();
  const gridCellPixelSize = useGridCellPixelSize();
  const gridStrokeWidth = useGridStrokeWidth();
  const gridOffset = useGridOffset();

  const mapStageRef = useMapStage();
  const [drawingShapeData, setDrawingShapeData] =
    useState<MeasureData | null>(null);
  const [isBrushDown, setIsBrushDown] = useState(false);

  const gridScale = parseGridScale(active && grid.measurement.scale);

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
      if (map.snapToGrid) {
        position = snapPositionToGrid(position);
      }
      return Vector2.divide(position, {
        x: mapImage.width(),
        y: mapImage.height(),
      });
    }

    function handleBrushDown() {
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

    function handleBrushMove() {
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

    function handleBrushUp() {
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

  function renderShape(shapeData: MeasureData) {
    const linePoints = shapeData.points.reduce(
      (acc: number[], point) => [
        ...acc,
        point.x * mapWidth,
        point.y * mapHeight,
      ],
      []
    );

    const lineCenter = Vector2.multiply(
      Vector2.divide(Vector2.add(shapeData.points[0], shapeData.points[1]), 2),
      { x: mapWidth, y: mapHeight }
    );

    return (
      <Group>
        <Line
          points={linePoints}
          strokeWidth={1.5 * gridStrokeWidth}
          stroke="hsla(230, 25%, 18%, 0.8)"
          lineCap="round"
        />
        <Line
          points={linePoints}
          strokeWidth={0.25 * gridStrokeWidth}
          stroke="white"
          lineCap="round"
        />
        <Label
          x={lineCenter.x}
          y={lineCenter.y}
          offsetX={26}
          offsetY={26}
          scaleX={1 / stageScale}
          scaleY={1 / stageScale}
        >
          <Tag fill="hsla(230, 25%, 18%, 0.8)" cornerRadius={4} />
          <Text
            text={`${(shapeData.length * gridScale.multiplier).toFixed(
              gridScale.digits
            )}${gridScale.unit}`}
            fill="white"
            fontSize={24}
            padding={4}
          />
        </Label>
      </Group>
    );
  }

  return <Group>{drawingShapeData && renderShape(drawingShapeData)}</Group>;
}

export default MapMeasure;

import React, { useContext, useState, useEffect } from "react";
import { Group, Line, Text, Label, Tag } from "react-konva";

import MapInteractionContext from "../../contexts/MapInteractionContext";
import MapStageContext from "../../contexts/MapStageContext";

import {
  getBrushPositionForTool,
  getDefaultShapeData,
  getUpdatedShapeData,
  getStrokeWidth,
} from "../../helpers/drawing";
import { getRelativePointerPositionNormalized } from "../../helpers/konva";
import * as Vector2 from "../../helpers/vector2";

function MapMeasure({ map, selectedToolSettings, active, gridSize }) {
  const { stageScale, mapWidth, mapHeight, interactionEmitter } = useContext(
    MapInteractionContext
  );
  const mapStageRef = useContext(MapStageContext);
  const [drawingShapeData, setDrawingShapeData] = useState(null);
  const [isBrushDown, setIsBrushDown] = useState(false);

  function parseToolScale(scale) {
    if (typeof scale === "string") {
      const match = scale.match(/(\d*)(\.\d*)?([a-zA-Z]*)/);
      const integer = parseFloat(match[1]);
      const fractional = parseFloat(match[2]);
      const unit = match[3] || "";
      if (!isNaN(integer) && !isNaN(fractional)) {
        return {
          multiplier: integer + fractional,
          unit: unit,
          digits: match[2].length - 1,
        };
      } else if (!isNaN(integer) && isNaN(fractional)) {
        return { multiplier: integer, unit: unit, digits: 0 };
      }
    }
    return { multiplier: 1, unit: "", digits: 0 };
  }

  const measureScale = parseToolScale(active && selectedToolSettings.scale);

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
      const brushPosition = getBrushPosition();
      const { points } = getDefaultShapeData("line", brushPosition);
      const length = 0;
      setDrawingShapeData({ length, points });
      setIsBrushDown(true);
    }

    function handleBrushMove() {
      const brushPosition = getBrushPosition();
      if (isBrushDown && drawingShapeData) {
        const { points } = getUpdatedShapeData(
          "line",
          drawingShapeData,
          brushPosition,
          gridSize
        );
        // Round the grid positions to the nearest 0.1 to aviod floating point issues
        const precision = { x: 0.1, y: 0.1 };
        const length = Vector2.distance(
          Vector2.roundTo(Vector2.divide(points[0], gridSize), precision),
          Vector2.roundTo(Vector2.divide(points[1], gridSize), precision),
          selectedToolSettings.type
        );
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

    interactionEmitter.on("dragStart", handleBrushDown);
    interactionEmitter.on("drag", handleBrushMove);
    interactionEmitter.on("dragEnd", handleBrushUp);

    return () => {
      interactionEmitter.off("dragStart", handleBrushDown);
      interactionEmitter.off("drag", handleBrushMove);
      interactionEmitter.off("dragEnd", handleBrushUp);
    };
  });

  function renderShape(shapeData) {
    const linePoints = shapeData.points.reduce(
      (acc, point) => [...acc, point.x * mapWidth, point.y * mapHeight],
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
          strokeWidth={getStrokeWidth(1.5, gridSize, mapWidth, mapHeight)}
          stroke="hsla(230, 25%, 18%, 0.8)"
          lineCap="round"
        />
        <Line
          points={linePoints}
          strokeWidth={getStrokeWidth(0.25, gridSize, mapWidth, mapHeight)}
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
            text={`${(shapeData.length * measureScale.multiplier).toFixed(
              measureScale.digits
            )}${measureScale.unit}`}
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

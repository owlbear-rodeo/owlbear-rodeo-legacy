import React, { useState, useEffect } from "react";
import shortid from "shortid";
import { Group, Line, Rect, Circle } from "react-konva";

import { useMapInteraction } from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import { useGrid } from "../../contexts/GridContext";

import Vector2 from "../../helpers/Vector2";
import {
  getDefaultShapeData,
  getUpdatedShapeData,
  simplifyPoints,
} from "../../helpers/drawing";
import colors from "../../helpers/colors";
import { getRelativePointerPosition } from "../../helpers/konva";

import useGridSnapping from "../../hooks/useGridSnapping";

function MapDrawing({
  map,
  shapes,
  onShapeAdd,
  onShapesRemove,
  active,
  toolSettings,
}) {
  const {
    stageScale,
    mapWidth,
    mapHeight,
    interactionEmitter,
  } = useMapInteraction();
  const { gridCellNormalizedSize, gridStrokeWidth } = useGrid();
  const mapStageRef = useMapStage();
  const [drawingShape, setDrawingShape] = useState(null);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [erasingShapes, setErasingShapes] = useState([]);

  const shouldHover = toolSettings.type === "erase" && active;
  const isBrush =
    toolSettings.type === "brush" || toolSettings.type === "paint";
  const isShape =
    toolSettings.type === "line" ||
    toolSettings.type === "rectangle" ||
    toolSettings.type === "circle" ||
    toolSettings.type === "triangle";

  const snapPositionToGrid = useGridSnapping();

  useEffect(() => {
    if (!active) {
      return;
    }
    const mapStage = mapStageRef.current;

    function getBrushPosition() {
      const mapImage = mapStage.findOne("#mapImage");
      let position = getRelativePointerPosition(mapImage);
      if (map.snapToGrid && isShape) {
        position = snapPositionToGrid(position);
      }
      return Vector2.divide(position, {
        x: mapImage.width(),
        y: mapImage.height(),
      });
    }

    function handleBrushDown() {
      const brushPosition = getBrushPosition();
      const commonShapeData = {
        color: toolSettings.color,
        blend: toolSettings.useBlending,
        id: shortid.generate(),
      };
      if (isBrush) {
        setDrawingShape({
          type: "path",
          pathType: toolSettings.type === "brush" ? "stroke" : "fill",
          data: { points: [brushPosition] },
          strokeWidth: toolSettings.type === "brush" ? 1 : 0,
          ...commonShapeData,
        });
      } else if (isShape) {
        setDrawingShape({
          type: "shape",
          shapeType: toolSettings.type,
          data: getDefaultShapeData(toolSettings.type, brushPosition),
          strokeWidth: toolSettings.type === "line" ? 1 : 0,
          ...commonShapeData,
        });
      }
      setIsBrushDown(true);
    }

    function handleBrushMove() {
      const brushPosition = getBrushPosition();
      if (isBrushDown && drawingShape) {
        if (isBrush) {
          setDrawingShape((prevShape) => {
            const prevPoints = prevShape.data.points;
            if (
              Vector2.compare(
                prevPoints[prevPoints.length - 1],
                brushPosition,
                0.001
              )
            ) {
              return prevShape;
            }
            const simplified = simplifyPoints(
              [...prevPoints, brushPosition],
              gridCellNormalizedSize,
              stageScale
            );
            return {
              ...prevShape,
              data: { points: simplified },
            };
          });
        } else if (isShape) {
          setDrawingShape((prevShape) => ({
            ...prevShape,
            data: getUpdatedShapeData(
              prevShape.shapeType,
              prevShape.data,
              brushPosition,
              gridCellNormalizedSize,
              mapWidth,
              mapHeight
            ),
          }));
        }
      }
    }

    function handleBrushUp() {
      if (isBrush && drawingShape) {
        if (drawingShape.data.points.length > 1) {
          onShapeAdd(drawingShape);
        }
      } else if (isShape && drawingShape) {
        onShapeAdd(drawingShape);
      }

      eraseHoveredShapes();

      setDrawingShape(null);
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

  function handleShapeOver(shape, isDown) {
    if (shouldHover && isDown) {
      if (erasingShapes.findIndex((s) => s.id === shape.id) === -1) {
        setErasingShapes((prevShapes) => [...prevShapes, shape]);
      }
    }
  }

  function eraseHoveredShapes() {
    if (erasingShapes.length > 0) {
      onShapesRemove(erasingShapes.map((shape) => shape.id));
      setErasingShapes([]);
    }
  }

  function renderShape(shape) {
    const defaultProps = {
      key: shape.id,
      onMouseMove: () => handleShapeOver(shape, isBrushDown),
      onTouchOver: () => handleShapeOver(shape, isBrushDown),
      onMouseDown: () => handleShapeOver(shape, true),
      onTouchStart: () => handleShapeOver(shape, true),
      onMouseUp: eraseHoveredShapes,
      onTouchEnd: eraseHoveredShapes,
      fill: colors[shape.color] || shape.color,
      opacity: shape.blend ? 0.5 : 1,
      id: shape.id,
    };
    if (shape.type === "path") {
      return (
        <Line
          points={shape.data.points.reduce(
            (acc, point) => [...acc, point.x * mapWidth, point.y * mapHeight],
            []
          )}
          stroke={colors[shape.color] || shape.color}
          tension={0.5}
          closed={shape.pathType === "fill"}
          fillEnabled={shape.pathType === "fill"}
          lineCap="round"
          lineJoin="round"
          strokeWidth={gridStrokeWidth * shape.strokeWidth}
          {...defaultProps}
        />
      );
    } else if (shape.type === "shape") {
      if (shape.shapeType === "rectangle") {
        return (
          <Rect
            x={shape.data.x * mapWidth}
            y={shape.data.y * mapHeight}
            width={shape.data.width * mapWidth}
            height={shape.data.height * mapHeight}
            {...defaultProps}
          />
        );
      } else if (shape.shapeType === "circle") {
        const minSide = mapWidth < mapHeight ? mapWidth : mapHeight;
        return (
          <Circle
            x={shape.data.x * mapWidth}
            y={shape.data.y * mapHeight}
            radius={shape.data.radius * minSide}
            {...defaultProps}
          />
        );
      } else if (shape.shapeType === "triangle") {
        return (
          <Line
            points={shape.data.points.reduce(
              (acc, point) => [...acc, point.x * mapWidth, point.y * mapHeight],
              []
            )}
            closed={true}
            {...defaultProps}
          />
        );
      } else if (shape.shapeType === "line") {
        return (
          <Line
            points={shape.data.points.reduce(
              (acc, point) => [...acc, point.x * mapWidth, point.y * mapHeight],
              []
            )}
            strokeWidth={gridStrokeWidth * shape.strokeWidth}
            stroke={colors[shape.color] || shape.color}
            lineCap="round"
            {...defaultProps}
          />
        );
      }
    }
  }

  function renderErasingShape(shape) {
    const eraseShape = {
      ...shape,
      color: "#BB99FF",
    };
    return renderShape(eraseShape);
  }

  return (
    <Group>
      {shapes.map(renderShape)}
      {drawingShape && renderShape(drawingShape)}
      {erasingShapes.length > 0 && erasingShapes.map(renderErasingShape)}
    </Group>
  );
}

export default MapDrawing;

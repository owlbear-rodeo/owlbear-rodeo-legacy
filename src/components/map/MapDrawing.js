import React, { useContext, useState, useEffect } from "react";
import shortid from "shortid";
import { Group, Line, Rect, Circle } from "react-konva";

import MapInteractionContext from "../../contexts/MapInteractionContext";
import MapStageContext from "../../contexts/MapStageContext";

import { compare as comparePoints } from "../../helpers/vector2";
import {
  getBrushPositionForTool,
  getDefaultShapeData,
  getUpdatedShapeData,
  simplifyPoints,
  getStrokeWidth,
} from "../../helpers/drawing";
import { getRelativePointerPositionNormalized } from "../../helpers/konva";

import colors from "../../helpers/colors";

function MapDrawing({
  shapes,
  onShapeAdd,
  onShapesRemove,
  selectedToolId,
  selectedToolSettings,
  gridSize,
}) {
  const { stageScale, mapWidth, mapHeight, interactionEmitter } = useContext(
    MapInteractionContext
  );
  const mapStageRef = useContext(MapStageContext);
  const [drawingShape, setDrawingShape] = useState(null);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [erasingShapes, setErasingShapes] = useState([]);

  const shouldHover =
    selectedToolSettings && selectedToolSettings.type === "erase";
  const isEditing = selectedToolId === "drawing";
  const isBrush =
    selectedToolSettings &&
    (selectedToolSettings.type === "brush" ||
      selectedToolSettings.type === "paint");
  const isShape =
    selectedToolSettings &&
    (selectedToolSettings.type === "line" ||
      selectedToolSettings.type === "rectangle" ||
      selectedToolSettings.type === "circle" ||
      selectedToolSettings.type === "triangle");

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const mapStage = mapStageRef.current;

    function getBrushPosition() {
      const mapImage = mapStage.findOne("#mapImage");
      return getBrushPositionForTool(
        getRelativePointerPositionNormalized(mapImage),
        selectedToolId,
        selectedToolSettings,
        gridSize,
        shapes
      );
    }

    function handleBrushDown() {
      const brushPosition = getBrushPosition();
      const commonShapeData = {
        color: selectedToolSettings && selectedToolSettings.color,
        blend: selectedToolSettings && selectedToolSettings.useBlending,
        id: shortid.generate(),
      };
      if (isBrush) {
        setDrawingShape({
          type: "path",
          pathType: selectedToolSettings.type === "brush" ? "stroke" : "fill",
          data: { points: [brushPosition] },
          strokeWidth: selectedToolSettings.type === "brush" ? 1 : 0,
          ...commonShapeData,
        });
      } else if (isShape) {
        setDrawingShape({
          type: "shape",
          shapeType: selectedToolSettings.type,
          data: getDefaultShapeData(selectedToolSettings.type, brushPosition),
          strokeWidth: selectedToolSettings.type === "line" ? 1 : 0,
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
              comparePoints(
                prevPoints[prevPoints.length - 1],
                brushPosition,
                0.001
              )
            ) {
              return prevShape;
            }
            const simplified = simplifyPoints(
              [...prevPoints, brushPosition],
              gridSize,
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
              gridSize
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

      if (erasingShapes.length > 0) {
        onShapesRemove(erasingShapes.map((shape) => shape.id));
        setErasingShapes([]);
      }

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
  }, [
    drawingShape,
    erasingShapes,
    gridSize,
    isBrush,
    isBrushDown,
    isEditing,
    isShape,
    mapStageRef,
    onShapeAdd,
    onShapesRemove,
    selectedToolId,
    selectedToolSettings,
    shapes,
    stageScale,
    interactionEmitter,
  ]);

  function handleShapeOver(shape, isDown) {
    if (shouldHover && isDown) {
      if (erasingShapes.findIndex((s) => s.id === shape.id) === -1) {
        setErasingShapes((prevShapes) => [...prevShapes, shape]);
      }
    }
  }

  function renderShape(shape) {
    const defaultProps = {
      key: shape.id,
      onMouseMove: () => handleShapeOver(shape, isBrushDown),
      onTouchOver: () => handleShapeOver(shape, isBrushDown),
      onMouseDown: () => handleShapeOver(shape, true),
      onTouchStart: () => handleShapeOver(shape, true),
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
          strokeWidth={getStrokeWidth(
            shape.strokeWidth,
            gridSize,
            mapWidth,
            mapHeight
          )}
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
            strokeWidth={getStrokeWidth(
              shape.strokeWidth,
              gridSize,
              mapWidth,
              mapHeight
            )}
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

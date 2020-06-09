import React, { useContext, useState, useCallback } from "react";
import shortid from "shortid";
import { Group, Line } from "react-konva";
import useImage from "use-image";

import diagonalPattern from "../../images/DiagonalPattern.png";

import MapInteractionContext from "../../contexts/MapInteractionContext";

import { compare as comparePoints } from "../../helpers/vector2";
import {
  getBrushPositionForTool,
  simplifyPoints,
  getStrokeWidth,
} from "../../helpers/drawing";

import colors from "../../helpers/colors";
import useMapBrush from "../../helpers/useMapBrush";

function MapFog({
  shapes,
  onShapeAdd,
  onShapeSubtract,
  onShapesRemove,
  onShapesEdit,
  selectedToolId,
  selectedToolSettings,
  gridSize,
}) {
  const { stageScale, mapWidth, mapHeight } = useContext(MapInteractionContext);
  const [drawingShape, setDrawingShape] = useState(null);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [editingShapes, setEditingShapes] = useState([]);

  const isEditing = selectedToolId === "fog";
  const shouldHover =
    isEditing &&
    (selectedToolSettings.type === "toggle" ||
      selectedToolSettings.type === "remove");

  const [patternImage] = useImage(diagonalPattern);

  const handleBrushUp = useCallback(() => {
    setIsBrushDown(false);
    if (editingShapes.length > 0) {
      if (selectedToolSettings.type === "remove") {
        onShapesRemove(editingShapes.map((shape) => shape.id));
      } else if (selectedToolSettings.type === "toggle") {
        onShapesEdit(
          editingShapes.map((shape) => ({ ...shape, visible: !shape.visible }))
        );
      }
      setEditingShapes([]);
    }
  }, [editingShapes, onShapesRemove, onShapesEdit, selectedToolSettings]);

  const handleShapeDraw = useCallback(
    (brushState, mapBrushPosition) => {
      function startShape() {
        const brushPosition = getBrushPositionForTool(
          mapBrushPosition,
          selectedToolId,
          selectedToolSettings,
          gridSize,
          shapes
        );
        if (
          selectedToolSettings.type === "add" ||
          selectedToolSettings.type === "subtract"
        ) {
          setDrawingShape({
            type: "fog",
            data: { points: [brushPosition] },
            strokeWidth: 0.5,
            color: selectedToolSettings.type === "add" ? "black" : "red",
            blend: false,
            id: shortid.generate(),
            visible: true,
          });
        }
        setIsBrushDown(true);
      }

      function continueShape() {
        const brushPosition = getBrushPositionForTool(
          mapBrushPosition,
          selectedToolId,
          selectedToolSettings,
          gridSize,
          shapes
        );
        if (
          selectedToolSettings.type === "add" ||
          selectedToolSettings.type === "subtract"
        ) {
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
            return {
              ...prevShape,
              data: { points: [...prevPoints, brushPosition] },
            };
          });
        }
      }

      function endShape() {
        if (selectedToolSettings.type === "add" && drawingShape) {
          if (drawingShape.data.points.length > 1) {
            const shape = {
              ...drawingShape,
              data: {
                points: simplifyPoints(
                  drawingShape.data.points,
                  gridSize,
                  // Downscale fog as smoothing doesn't currently work with edge snapping
                  stageScale / 2
                ),
              },
            };
            onShapeAdd(shape);
          }
        }
        if (selectedToolSettings.type === "subtract" && drawingShape) {
          if (drawingShape.data.points.length > 1) {
            const shape = {
              data: {
                points: simplifyPoints(
                  drawingShape.data.points,
                  gridSize,
                  // Downscale fog as smoothing doesn't currently work with edge snapping
                  stageScale / 2
                ),
              },
              id: drawingShape.id,
              type: drawingShape.type,
            };
            onShapeSubtract(shape);
          }
        }
        setDrawingShape(null);
        handleBrushUp();
      }

      switch (brushState) {
        case "first":
          startShape();
          return;
        case "drawing":
          continueShape();
          return;
        case "last":
          endShape();
          return;
        default:
          return;
      }
    },
    [
      selectedToolId,
      selectedToolSettings,
      gridSize,
      stageScale,
      onShapeAdd,
      onShapeSubtract,
      shapes,
      drawingShape,
      handleBrushUp,
    ]
  );

  useMapBrush(isEditing, handleShapeDraw);

  function handleShapeOver(shape, isDown) {
    if (shouldHover && isDown) {
      if (editingShapes.findIndex((s) => s.id === shape.id) === -1) {
        setEditingShapes((prevShapes) => [...prevShapes, shape]);
      }
    }
  }

  function renderShape(shape) {
    return (
      <Line
        key={shape.id}
        onMouseMove={() => handleShapeOver(shape, isBrushDown)}
        onTouchOver={() => handleShapeOver(shape, isBrushDown)}
        onMouseDown={() => handleShapeOver(shape, true)}
        onTouchStart={() => handleShapeOver(shape, true)}
        points={shape.data.points.reduce(
          (acc, point) => [...acc, point.x * mapWidth, point.y * mapHeight],
          []
        )}
        stroke={colors[shape.color] || shape.color}
        fill={colors[shape.color] || shape.color}
        closed
        lineCap="round"
        strokeWidth={getStrokeWidth(
          shape.strokeWidth,
          gridSize,
          mapWidth,
          mapHeight
        )}
        visible={isEditing || shape.visible}
        opacity={isEditing ? 0.5 : 1}
        fillPatternImage={patternImage}
        fillPriority={isEditing && !shape.visible ? "pattern" : "color"}
      />
    );
  }

  function renderEditingShape(shape) {
    const editingShape = {
      ...shape,
      color: "#BB99FF",
    };
    return renderShape(editingShape);
  }

  return (
    <Group>
      {shapes.map(renderShape)}
      {drawingShape && renderShape(drawingShape)}
      {editingShapes.length > 0 && editingShapes.map(renderEditingShape)}
    </Group>
  );
}

export default MapFog;

import React, { useContext, useEffect, useState } from "react";
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

function MapFog({
  shapes,
  onShapeAdd,
  onShapeRemove,
  onShapeEdit,
  selectedToolId,
  selectedToolSettings,
  gridSize,
}) {
  const {
    stageDragState,
    mapDragPosition,
    stageScale,
    mapWidth,
    mapHeight,
  } = useContext(MapInteractionContext);
  const [drawingShape, setDrawingShape] = useState(null);

  const isEditing = selectedToolId === "fog";
  const shouldHover =
    isEditing &&
    (selectedToolSettings.type === "toggle" ||
      selectedToolSettings.type === "remove");

  const [patternImage] = useImage(diagonalPattern);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    function startShape() {
      const brushPosition = getBrushPositionForTool(
        mapDragPosition,
        selectedToolId,
        selectedToolSettings,
        gridSize,
        shapes
      );
      if (selectedToolSettings.type === "add") {
        setDrawingShape({
          type: "fog",
          data: { points: [brushPosition] },
          strokeWidth: 0.5,
          color: "black",
          blend: false,
          id: shortid.generate(),
          visible: true,
        });
      }
    }

    function continueShape() {
      const brushPosition = getBrushPositionForTool(
        mapDragPosition,
        selectedToolId,
        selectedToolSettings,
        gridSize,
        shapes
      );
      if (selectedToolSettings.type === "add") {
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
      setDrawingShape(null);
    }

    switch (stageDragState) {
      case "first":
        startShape();
        return;
      case "dragging":
        continueShape();
        return;
      case "last":
        endShape();
        return;
      default:
        return;
    }
  }, [
    stageDragState,
    mapDragPosition,
    selectedToolId,
    selectedToolSettings,
    isEditing,
    gridSize,
    stageScale,
    onShapeAdd,
    shapes,
    drawingShape,
  ]);

  function handleShapeClick(_, shape) {
    if (!isEditing) {
      return;
    }

    if (selectedToolSettings.type === "remove") {
      onShapeRemove(shape.id);
    } else if (selectedToolSettings.type === "toggle") {
      onShapeEdit({ ...shape, visible: !shape.visible });
    }
  }

  function handleShapeMouseOver(event, shape) {
    if (shouldHover) {
      const path = event.target;
      if (shape.visible) {
        const hoverColor = "#BB99FF";
        path.fill(hoverColor);
      } else {
        path.opacity(1);
      }
      path.getLayer().draw();
    }
  }

  function handleShapeMouseOut(event, shape) {
    if (shouldHover) {
      const path = event.target;
      if (shape.visible) {
        const color = colors[shape.color] || shape.color;
        path.fill(color);
      } else {
        path.opacity(0.5);
      }
      path.getLayer().draw();
    }
  }

  function renderShape(shape) {
    return (
      <Line
        key={shape.id}
        onMouseOver={(e) => handleShapeMouseOver(e, shape)}
        onMouseOut={(e) => handleShapeMouseOut(e, shape)}
        onClick={(e) => handleShapeClick(e, shape)}
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

  return (
    <Group>
      {shapes.map(renderShape)}
      {drawingShape && renderShape(drawingShape)}
    </Group>
  );
}

export default MapFog;

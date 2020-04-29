import React, { useRef, useEffect, useState, useContext } from "react";
import shortid from "shortid";

import { compare as comparePoints } from "../../helpers/vector2";
import {
  getBrushPositionForTool,
  isShapeHovered,
  drawShape,
  simplifyPoints,
  getRelativePointerPosition,
} from "../../helpers/drawing";

import MapInteractionContext from "../../contexts/MapInteractionContext";

import diagonalPattern from "../../images/DiagonalPattern.png";

function MapFog({
  width,
  height,
  isEditing,
  toolSettings,
  shapes,
  onShapeAdd,
  onShapeRemove,
  onShapeEdit,
  gridSize,
}) {
  const canvasRef = useRef();
  const containerRef = useRef();

  const [isPointerDown, setIsPointerDown] = useState(false);
  const [drawingShape, setDrawingShape] = useState(null);
  const [pointerPosition, setPointerPosition] = useState({ x: -1, y: -1 });

  const shouldHover =
    isEditing &&
    (toolSettings.type === "toggle" || toolSettings.type === "remove");

  const { scaleRef } = useContext(MapInteractionContext);

  // Reset pointer position when tool changes
  useEffect(() => {
    setPointerPosition({ x: -1, y: -1 });
  }, [isEditing, toolSettings]);

  function handleStart(event) {
    if (!isEditing) {
      return;
    }
    if (event.touches && event.touches.length !== 1) {
      setIsPointerDown(false);
      setDrawingShape(null);
      return;
    }
    const pointer = event.touches ? event.touches[0] : event;
    const position = getRelativePointerPosition(pointer, containerRef.current);
    setPointerPosition(position);
    setIsPointerDown(true);
    const brushPosition = getBrushPositionForTool(
      position,
      "fog",
      toolSettings,
      gridSize,
      shapes
    );
    if (isEditing && toolSettings.type === "add") {
      setDrawingShape({
        type: "fog",
        data: { points: [brushPosition] },
        strokeWidth: 0.1,
        color: "black",
        blend: true, // Blend while drawing
        id: shortid.generate(),
        visible: true,
      });
    }
  }

  function handleMove(event) {
    if (!isEditing) {
      return;
    }
    if (event.touches && event.touches.length !== 1) {
      return;
    }
    const pointer = event.touches ? event.touches[0] : event;
    const position = getRelativePointerPosition(pointer, containerRef.current);
    // Set pointer position every frame for erase tool and fog
    if (shouldHover) {
      setPointerPosition(position);
    }
    if (isPointerDown) {
      setPointerPosition(position);
      const brushPosition = getBrushPositionForTool(
        position,
        "fog",
        toolSettings,
        gridSize,
        shapes
      );
      if (isEditing && toolSettings.type === "add" && drawingShape) {
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
  }

  function handleStop(event) {
    if (!isEditing) {
      return;
    }
    if (event.touches && event.touches.length !== 0) {
      return;
    }
    if (isEditing && toolSettings.type === "add" && drawingShape) {
      if (drawingShape.data.points.length > 1) {
        const shape = {
          ...drawingShape,
          data: {
            points: simplifyPoints(
              drawingShape.data.points,
              gridSize,
              // Downscale fog as smoothing doesn't currently work with edge snapping
              scaleRef.current / 2
            ),
          },
          blend: false,
        };
        onShapeAdd(shape);
      }
    }

    if (hoveredShapeRef.current && isPointerDown) {
      if (toolSettings.type === "remove") {
        onShapeRemove(hoveredShapeRef.current.id);
      } else if (toolSettings.type === "toggle") {
        onShapeEdit({
          ...hoveredShapeRef.current,
          visible: !hoveredShapeRef.current.visible,
        });
      }
    }
    setDrawingShape(null);
    setIsPointerDown(false);
  }

  // Add listeners for draw events on map to allow drawing past the bounds
  // of the container
  useEffect(() => {
    const map = document.querySelector(".map");
    map.addEventListener("mousedown", handleStart);
    map.addEventListener("mousemove", handleMove);
    map.addEventListener("mouseup", handleStop);
    map.addEventListener("touchstart", handleStart);
    map.addEventListener("touchmove", handleMove);
    map.addEventListener("touchend", handleStop);

    return () => {
      map.removeEventListener("mousedown", handleStart);
      map.removeEventListener("mousemove", handleMove);
      map.removeEventListener("mouseup", handleStop);
      map.removeEventListener("touchstart", handleStart);
      map.removeEventListener("touchmove", handleMove);
      map.removeEventListener("touchend", handleStop);
    };
  });

  /**
   * Rendering
   */
  const hoveredShapeRef = useRef(null);
  const diagonalPatternRef = useRef();

  useEffect(() => {
    let image = new Image();
    image.src = diagonalPattern;
    diagonalPatternRef.current = image;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");

      context.clearRect(0, 0, width, height);
      let hoveredShape = null;
      if (isEditing) {
        const editPattern = context.createPattern(
          diagonalPatternRef.current,
          "repeat"
        );
        for (let shape of shapes) {
          if (shouldHover) {
            if (
              isShapeHovered(shape, context, pointerPosition, width, height)
            ) {
              hoveredShape = shape;
            }
          }
          drawShape(
            {
              ...shape,
              blend: true,
              color: shape.visible ? "black" : editPattern,
            },
            context,
            gridSize,
            width,
            height
          );
        }
        if (drawingShape) {
          drawShape(drawingShape, context, gridSize, width, height);
        }
        if (hoveredShape) {
          const shape = { ...hoveredShape, color: "#BB99FF", blend: true };
          drawShape(shape, context, gridSize, width, height);
        }
      } else {
        // Not editing
        for (let shape of shapes) {
          if (shape.visible) {
            drawShape(shape, context, gridSize, width, height);
          }
        }
      }
      hoveredShapeRef.current = hoveredShape;
    }
  }, [
    shapes,
    width,
    height,
    pointerPosition,
    isEditing,
    drawingShape,
    gridSize,
    shouldHover,
  ]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
      }}
      ref={containerRef}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default MapFog;

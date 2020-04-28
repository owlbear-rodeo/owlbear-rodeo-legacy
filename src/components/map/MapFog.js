import React, { useRef, useEffect, useState } from "react";
import shortid from "shortid";

import { compare as comparePoints } from "../../helpers/vector2";

import {
  getBrushPositionForTool,
  isShapeHovered,
  drawShape,
  simplifyPoints,
  getRelativePointerPosition,
} from "../../helpers/drawing";

function MapFog({
  width,
  height,
  isEditing,
  toolSettings,
  shapes,
  onShapeAdd,
  onShapeRemove,
  gridSize,
}) {
  const canvasRef = useRef();
  const containerRef = useRef();

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingShape, setDrawingShape] = useState(null);
  const [pointerPosition, setPointerPosition] = useState({ x: -1, y: -1 });

  const shouldHover =
    isEditing &&
    (toolSettings.type === "toggle" || toolSettings.type === "remove");

  // Reset pointer position when tool changes
  useEffect(() => {
    setPointerPosition({ x: -1, y: -1 });
  }, [isEditing, toolSettings]);

  function handleStart(event) {
    if (!isEditing) {
      return;
    }
    if (event.touches && event.touches.length !== 1) {
      setIsDrawing(false);
      setDrawingShape(null);
      return;
    }
    const pointer = event.touches ? event.touches[0] : event;
    const position = getRelativePointerPosition(pointer, containerRef.current);
    setPointerPosition(position);
    setIsDrawing(true);
    const brushPosition = getBrushPositionForTool(
      position,
      "fog",
      toolSettings,
      gridSize,
      shapes
    );
    const commonShapeData = {
      id: shortid.generate(),
    };
    if (isEditing && toolSettings.type === "add") {
      setDrawingShape({
        type: "fog",
        data: { points: [brushPosition] },
        strokeWidth: 0.1,
        color: "black",
        blend: true, // Blend while drawing
        ...commonShapeData,
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
    if (isDrawing) {
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
          data: { points: simplifyPoints(drawingShape.data.points, gridSize) },
          blend: false,
        };
        onShapeAdd(shape);
      }
    }

    if (
      toolSettings.type === "remove" &&
      hoveredShapeRef.current &&
      isDrawing
    ) {
      onShapeRemove(hoveredShapeRef.current.id);
    }
    setDrawingShape(null);
    setIsDrawing(false);
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
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");

      context.clearRect(0, 0, width, height);
      let hoveredShape = null;
      for (let shape of shapes) {
        if (shouldHover) {
          if (isShapeHovered(shape, context, pointerPosition, width, height)) {
            hoveredShape = shape;
          }
        }
        if (isEditing) {
          drawShape(
            { ...shape, blend: true },
            context,
            gridSize,
            width,
            height
          );
        } else {
          drawShape(shape, context, gridSize, width, height);
        }
      }
      if (drawingShape) {
        drawShape(drawingShape, context, gridSize, width, height);
      }
      if (hoveredShape) {
        const shape = { ...hoveredShape, color: "#BB99FF", blend: true };
        drawShape(shape, context, gridSize, width, height);
      }
      hoveredShapeRef.current = hoveredShape;
    }
  }, [
    shapes,
    width,
    height,
    pointerPosition,
    isDrawing,
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

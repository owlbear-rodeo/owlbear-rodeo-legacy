import React, { useRef, useEffect, useState } from "react";
import simplify from "simplify-js";
import shortid from "shortid";

import {
  getBrushPositionForTool,
  getDefaultShapeData,
  getUpdatedShapeData,
  getStrokeSize,
  isShapeHovered,
  drawShape,
} from "../../helpers/drawing";

function MapDrawing({
  width,
  height,
  selectedTool,
  toolSettings,
  shapes,
  onShapeAdd,
  onShapeRemove,
  gridSize,
}) {
  const canvasRef = useRef();
  const containerRef = useRef();

  // const [brushPoints, setBrushPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingShape, setDrawingShape] = useState(null);
  const [pointerPosition, setPointerPosition] = useState({ x: -1, y: -1 });

  // Reset pointer position when tool changes
  useEffect(() => {
    setPointerPosition({ x: -1, y: -1 });
  }, [selectedTool]);

  function getRelativePointerPosition(event) {
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const x = (event.clientX - containerRect.x) / containerRect.width;
      const y = (event.clientY - containerRect.y) / containerRect.height;
      return { x, y };
    }
  }

  function handleStart(event) {
    if (event.touches && event.touches.length !== 1) {
      setIsDrawing(false);
      setDrawingShape(null);
      return;
    }
    const pointer = event.touches ? event.touches[0] : event;
    const position = getRelativePointerPosition(pointer);
    setPointerPosition(position);
    setIsDrawing(true);
    const brushPosition = getBrushPositionForTool(
      position,
      selectedTool,
      gridSize,
      shapes
    );
    const commonShapeData = {
      id: shortid.generate(),
      color: toolSettings && toolSettings.color,
      blend: toolSettings && toolSettings.useBlending,
    };
    if (selectedTool === "brush") {
      setDrawingShape({
        type: "path",
        pathType: toolSettings.type,
        data: { points: [brushPosition] },
        strokeWidth: toolSettings.type === "stroke" ? 1 : 0,
        ...commonShapeData,
      });
    } else if (selectedTool === "shape") {
      setDrawingShape({
        type: "shape",
        shapeType: toolSettings.type,
        data: getDefaultShapeData(toolSettings.type, brushPosition),
        strokeWidth: 0,
        ...commonShapeData,
      });
    }
  }

  function handleMove(event) {
    if (event.touches && event.touches.length !== 1) {
      return;
    }
    const pointer = event.touches ? event.touches[0] : event;
    const position = getRelativePointerPosition(pointer);
    if (selectedTool === "erase") {
      setPointerPosition(position);
    }
    if (isDrawing) {
      setPointerPosition(position);
      const brushPosition = getBrushPositionForTool(
        position,
        selectedTool,
        gridSize,
        shapes
      );
      if (selectedTool === "brush") {
        setDrawingShape((prevShape) => {
          const prevPoints = prevShape.data.points;
          if (prevPoints[prevPoints.length - 1] === brushPosition) {
            return prevPoints;
          }
          const simplified = simplify(
            [...prevPoints, brushPosition],
            getStrokeSize(drawingShape.strokeWidth, gridSize, 1, 1) * 0.1
          );
          return {
            ...prevShape,
            data: { points: simplified },
          };
        });
      } else if (selectedTool === "shape") {
        setDrawingShape((prevShape) => ({
          ...prevShape,
          data: getUpdatedShapeData(
            prevShape.shapeType,
            prevShape.data,
            brushPosition
          ),
        }));
      }
    }
  }

  function handleStop(event) {
    if (event.touches && event.touches.length !== 0) {
      return;
    }
    setIsDrawing(false);
    if (selectedTool === "brush") {
      if (drawingShape.data.points.length > 1) {
        onShapeAdd(drawingShape);
      }
    } else if (selectedTool === "shape") {
      onShapeAdd(drawingShape);
    }

    setDrawingShape(null);
    if (selectedTool === "erase" && hoveredShapeRef.current) {
      onShapeRemove(hoveredShapeRef.current.id);
    }
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
        // Detect hover
        if (selectedTool === "erase") {
          if (isShapeHovered(shape, context, pointerPosition, width, height)) {
            hoveredShape = shape;
          }
        }
        drawShape(shape, context, gridSize, width, height);
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
    selectedTool,
    drawingShape,
    gridSize,
  ]);

  return (
    <div
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
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

export default MapDrawing;

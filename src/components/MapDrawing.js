import React, { useRef, useEffect, useState } from "react";
import simplify from "simplify-js";
import shortid from "shortid";

import colors from "../helpers/colors";
import { snapPositionToGrid } from "../helpers/shared";

function MapDrawing({
  width,
  height,
  selectedTool,
  shapes,
  onShapeAdd,
  onShapeRemove,
  brushColor,
  useGridSnapping,
  gridSize,
}) {
  const canvasRef = useRef();
  const containerRef = useRef();

  const [brushPoints, setBrushPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
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
      setBrushPoints([]);
      return;
    }
    const pointer = event.touches ? event.touches[0] : event;
    const position = getRelativePointerPosition(pointer);
    setPointerPosition(position);
    setIsDrawing(true);
    if (selectedTool === "brush") {
      const brushPosition = useGridSnapping
        ? snapPositionToGrid(position, gridSize)
        : position;
      setBrushPoints([brushPosition]);
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
    if (isDrawing && selectedTool === "brush") {
      setPointerPosition(position);
      const brushPosition = useGridSnapping
        ? snapPositionToGrid(position, gridSize)
        : position;
      setBrushPoints((prevPoints) => {
        if (prevPoints[prevPoints.length - 1] === brushPosition) {
          return prevPoints;
        }
        return [...prevPoints, brushPosition];
      });
    }
  }

  function handleStop(event) {
    if (event.touches && event.touches.length !== 0) {
      return;
    }
    setIsDrawing(false);
    if (selectedTool === "brush") {
      if (brushPoints.length > 1) {
        const simplifiedPoints = simplify(brushPoints, 0.001);
        onShapeAdd({
          id: shortid.generate(),
          points: simplifiedPoints,
          color: brushColor,
        });
        setBrushPoints([]);
      }
    }
    if (selectedTool === "erase" && hoveredShapeRef.current) {
      onShapeRemove(hoveredShapeRef.current.id);
    }
  }

  const hoveredShapeRef = useRef(null);
  useEffect(() => {
    function pointsToPath(points) {
      const path = new Path2D();
      path.moveTo(points[0].x * width, points[0].y * height);
      for (let point of points.slice(1)) {
        path.lineTo(point.x * width, point.y * height);
      }
      path.closePath();
      return path;
    }

    function drawPath(path, color, context) {
      context.fillStyle = color;
      context.strokeStyle = color;
      context.stroke(path);
      context.fill(path);
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");

      context.clearRect(0, 0, width, height);
      let hoveredShape = null;
      for (let shape of shapes) {
        const path = pointsToPath(shape.points);
        // Detect hover
        if (selectedTool === "erase") {
          if (
            context.isPointInPath(
              path,
              pointerPosition.x * width,
              pointerPosition.y * height
            )
          ) {
            hoveredShape = shape;
          }
        }
        drawPath(path, colors[shape.color], context);
      }
      if (selectedTool === "brush" && brushPoints.length > 0) {
        const path = pointsToPath(brushPoints);
        drawPath(path, colors[brushColor], context);
      }
      if (hoveredShape) {
        const path = pointsToPath(hoveredShape.points);
        drawPath(path, "#BB99FF", context);
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
    brushPoints,
    brushColor,
  ]);

  return (
    <div
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      ref={containerRef}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleStop}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleStop}
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

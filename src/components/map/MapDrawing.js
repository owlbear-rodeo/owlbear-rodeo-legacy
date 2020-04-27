import React, { useRef, useEffect, useState } from "react";
import simplify from "simplify-js";
import shortid from "shortid";

import colors from "../../helpers/colors";
import { snapPositionToGrid } from "../../helpers/shared";

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

  const toolColor = toolSettings && toolSettings.color;
  const useToolBlending = toolSettings && toolSettings.useBlending;
  const useGridSnapping = toolSettings && toolSettings.useGridSnapping;

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
        const type = "path";

        if (type !== null) {
          const data = { points: simplifiedPoints };
          onShapeAdd({
            type,
            data,
            id: shortid.generate(),
            color: toolColor,
            blend: useToolBlending,
          });
        }

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

    function circleToPath(x, y, radius) {
      const path = new Path2D();
      const minSide = width < height ? width : height;
      path.arc(x * width, y * height, radius * minSide, 0, 2 * Math.PI, true);
      return path;
    }

    function rectangleToPath(x, y, w, h) {
      const path = new Path2D();
      path.rect(x * width, y * height, w * width, h * height);
      return path;
    }

    function shapeToPath(shape) {
      const data = shape.data;
      if (shape.type === "path") {
        return pointsToPath(data.points);
      } else if (shape.type === "circle") {
        return circleToPath(data.x, data.y, data.radius);
      } else if (shape.type === "rectangle") {
        return rectangleToPath(data.x, data.y, data.width, data.height);
      } else if (shape.type === "triangle") {
        return pointsToPath(data.points);
      }
    }

    function drawPath(path, color, blend, context) {
      context.globalAlpha = blend ? 0.5 : 1.0;
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
        const path = shapeToPath(shape);
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
        drawPath(path, colors[shape.color], shape.blend, context);
      }
      if (selectedTool === "brush" && brushPoints.length > 0) {
        const path = pointsToPath(brushPoints);
        drawPath(path, colors[toolColor], useToolBlending, context);
      }
      if (hoveredShape) {
        const path = shapeToPath(hoveredShape);
        drawPath(path, "#BB99FF", true, context);
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
    toolColor,
    useToolBlending,
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

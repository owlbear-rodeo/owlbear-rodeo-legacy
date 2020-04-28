import React, { useRef, useEffect, useState } from "react";
import simplify from "simplify-js";
import shortid from "shortid";

import colors from "../../helpers/colors";
import {
  getBrushPositionForTool,
  getDefaultShapeData,
  getUpdatedShapeData,
  getStrokeSize,
  shapeHasFill,
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
      toolSettings,
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
        toolSettings,
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
    function pointsToPath(points, close) {
      const path = new Path2D();
      if (points.length < 2) {
        return path;
      }
      path.moveTo(points[0].x * width, points[0].y * height);

      // Draw a smooth curve between the points
      for (let i = 1; i < points.length - 2; i++) {
        var xc = (points[i].x * width + points[i + 1].x * width) / 2;
        var yc = (points[i].y * height + points[i + 1].y * height) / 2;
        path.quadraticCurveTo(
          points[i].x * width,
          points[i].y * height,
          xc,
          yc
        );
      }
      // Curve through the last two points
      path.quadraticCurveTo(
        points[points.length - 2].x * width,
        points[points.length - 2].y * height,
        points[points.length - 1].x * width,
        points[points.length - 1].y * height
      );

      if (close) {
        path.closePath();
      }
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

    function triangleToPath(points) {
      const path = new Path2D();
      path.moveTo(points[0].x * width, points[0].y * height);
      for (let point of points.slice(1)) {
        path.lineTo(point.x * width, point.y * height);
      }
      path.closePath();

      return path;
    }

    function shapeToPath(shape) {
      const data = shape.data;
      if (shape.type === "path") {
        return pointsToPath(data.points, shape.pathType === "fill");
      } else if (shape.type === "shape") {
        if (shape.shapeType === "circle") {
          return circleToPath(data.x, data.y, data.radius);
        } else if (shape.shapeType === "rectangle") {
          return rectangleToPath(data.x, data.y, data.width, data.height);
        } else if (shape.shapeType === "triangle") {
          return triangleToPath(data.points);
        }
      }
    }

    function drawPath(path, color, fill, strokeWidth, blend, context) {
      context.globalAlpha = blend ? 0.5 : 1.0;
      context.fillStyle = color;
      context.strokeStyle = color;
      if (strokeWidth > 0) {
        context.lineCap = "round";
        context.lineWidth = getStrokeSize(strokeWidth, gridSize, width, height);
        context.stroke(path);
      }
      if (fill) {
        context.fill(path);
      }
    }

    function isPathHovered(path, hasFill, context) {
      if (hasFill) {
        return context.isPointInPath(
          path,
          pointerPosition.x * width,
          pointerPosition.y * height
        );
      } else {
        return context.isPointInStroke(
          path,
          pointerPosition.x * width,
          pointerPosition.y * height
        );
      }
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
          if (isPathHovered(path, shapeHasFill(shape), context)) {
            hoveredShape = shape;
          }
        }

        drawPath(
          path,
          colors[shape.color],
          shapeHasFill(shape),
          shape.strokeWidth,
          shape.blend,
          context
        );
      }
      if (drawingShape) {
        const path = shapeToPath(drawingShape);
        drawPath(
          path,
          colors[drawingShape.color],
          shapeHasFill(drawingShape),
          drawingShape.strokeWidth,
          drawingShape.blend,
          context
        );
      }
      if (hoveredShape) {
        const path = shapeToPath(hoveredShape);
        drawPath(
          path,
          "#BB99FF",
          shapeHasFill(hoveredShape),
          hoveredShape.strokeWidth,
          true,
          context
        );
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

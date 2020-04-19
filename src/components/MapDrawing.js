import React, { useRef, useEffect, useState } from "react";
import simplify from "simplify-js";
import shortid from "shortid";

function MapDrawing({
  width,
  height,
  selectedTool,
  shapes,
  onShapeAdd,
  onShapeRemove,
}) {
  const canvasRef = useRef();
  const containerRef = useRef();

  function getMousePosition(event) {
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const x = (event.clientX - containerRect.x) / containerRect.width;
      const y = (event.clientY - containerRect.y) / containerRect.height;
      return { x, y };
    }
  }

  const [brushPoints, setBrushPoints] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  function handleMouseDown(event) {
    setIsMouseDown(true);
    if (selectedTool === "brush") {
      const position = getMousePosition(event);
      setBrushPoints([position]);
    }
  }

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  function handleMouseMove(event) {
    const position = getMousePosition(event);
    if (selectedTool === "erase") {
      setMousePosition(position);
    }
    if (isMouseDown && selectedTool === "brush") {
      setMousePosition(position);
      setBrushPoints((prevPoints) => [...prevPoints, position]);
    }
  }

  function handleMouseUp(event) {
    setIsMouseDown(false);
    if (selectedTool === "brush") {
      const simplifiedPoints = simplify(brushPoints, 0.001);
      onShapeAdd({ id: shortid.generate(), points: simplifiedPoints });
      setBrushPoints([]);
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
              mousePosition.x * width,
              mousePosition.y * height
            )
          ) {
            hoveredShape = shape;
          }
        }
        drawPath(path, "#000000", context);
      }
      if (selectedTool === "brush" && brushPoints.length > 0) {
        const path = pointsToPath(brushPoints);
        drawPath(path, "#000000", context);
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
    mousePosition,
    isMouseDown,
    selectedTool,
    brushPoints,
  ]);

  return (
    <div
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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

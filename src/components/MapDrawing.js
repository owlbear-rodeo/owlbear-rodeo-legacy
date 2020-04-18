import React, { useRef, useEffect, useState } from "react";
import simplify from "simplify-js";

function MapDrawing({ width, height, selectedTool }) {
  const canvasRef = useRef();
  const containerRef = useRef();

  const [shapes, setShapes] = useState([]);

  function getMousePosition(event) {
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const x = (event.clientX - containerRect.x) / containerRect.width;
      const y = (event.clientY - containerRect.y) / containerRect.height;
      return { x, y };
    }
  }

  const [isMouseDown, setIsMouseDown] = useState(false);
  function handleMouseDown(event) {
    setIsMouseDown(true);
    if (selectedTool === "brush") {
      const position = getMousePosition(event);
      setShapes((prevShapes) => [...prevShapes, { points: [position] }]);
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
      setShapes((prevShapes) => {
        const currentShape = prevShapes.slice(-1)[0];
        const otherShapes = prevShapes.slice(0, -1);
        return [...otherShapes, { points: [...currentShape.points, position] }];
      });
    }
  }

  function handleMouseUp(event) {
    setIsMouseDown(false);
    if (selectedTool === "brush") {
      setShapes((prevShapes) => {
        const currentShape = prevShapes.slice(-1)[0];
        const otherShapes = prevShapes.slice(0, -1);
        const simplified = simplify(currentShape.points, 0.001);
        return [...otherShapes, { points: simplified }];
      });
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");

      context.clearRect(0, 0, width, height);
      let erasedShapes = [];
      for (let [index, shape] of shapes.entries()) {
        const path = new Path2D();
        path.moveTo(shape.points[0].x * width, shape.points[0].y * height);
        for (let point of shape.points.slice(1)) {
          path.lineTo(point.x * width, point.y * height);
        }
        path.closePath();
        let color = "#000000";
        if (selectedTool === "erase") {
          if (
            context.isPointInPath(
              path,
              mousePosition.x * width,
              mousePosition.y * height
            )
          ) {
            color = "#BB99FF";
            if (isMouseDown) {
              erasedShapes.push(index);
              continue;
            }
          }
        }
        context.fillStyle = color;
        context.strokeStyle = color;
        context.stroke(path);
        context.fill(path);
      }

      if (erasedShapes.length > 0) {
        setShapes((prevShapes) =>
          prevShapes.filter((_, i) => !erasedShapes.includes(i))
        );
      }
    }
  }, [shapes, width, height, mousePosition, isMouseDown, selectedTool]);

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

import React, { useRef, useEffect, useState } from "react";

function MapDrawing({ width, height }) {
  const canvasRef = useRef();
  const containerRef = useRef();

  const [shapes, setShapes] = useState([]);

  function getMousePosition(event) {
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const x = (event.clientX - containerRect.x) / containerRect.width;
      const y = (event.clientY - containerRect.y) / containerRect.height;
      return { x: x * width, y: y * height };
    }
  }

  const [isMouseDown, setIsMouseDown] = useState(false);
  function handleMouseDown(event) {
    setIsMouseDown(true);
    const position = getMousePosition(event);
    setShapes((prevShapes) => [...prevShapes, { points: [position] }]);
  }

  function handleMouseMove(event) {
    if (isMouseDown) {
      const position = getMousePosition(event);
      setShapes((prevShapes) => {
        const currentShape = prevShapes.slice(-1)[0];
        const otherShapes = prevShapes.slice(0, -1);
        return [...otherShapes, { points: [...currentShape.points, position] }];
      });
    }
  }

  function handleMouseUp(event) {
    setIsMouseDown(false);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");

      context.clearRect(0, 0, width, height);
      for (let shape of shapes) {
        context.beginPath();
        context.moveTo(shape.points[0].x, shape.points[0].y);
        for (let point of shape.points.slice(1)) {
          context.lineTo(point.x, point.y);
        }
        context.closePath();
        context.stroke();
        context.fill();
      }
    }
  }, [shapes, width, height]);

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

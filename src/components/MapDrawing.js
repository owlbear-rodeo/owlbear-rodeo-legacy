import React, { useRef, useEffect } from "react";
import Two from "two.js";

function MapDrawing({ width, height }) {
  const twoRef = useRef(new Two({ type: Two.Types.canvas }));
  const containerRef = useRef();

  useEffect(() => {
    const two = twoRef.current;
    const container = containerRef.current;
    if (two && container) {
      two.width = width;
      two.height = height;
      two.update();
      // Force the canvas to be 100% after update
      const canvas = container.firstChild;
      if (canvas) {
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }
    }
  }, [width, height]);

  useEffect(() => {
    const two = twoRef.current;
    two.appendTo(containerRef.current);
  }, []);

  function getMousePosition(event) {
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const x = (event.clientX - containerRect.x) / containerRect.width;
      const y = (event.clientY - containerRect.y) / containerRect.height;
      let v = new Two.Vector(x * width, y * height);
      v.position = new Two.Vector().copy(v);
      return v;
    }
  }

  const mouseDownRef = useRef(false);
  const shapeRef = useRef();
  function handleMouseDown(event) {
    const two = twoRef.current;
    if (two) {
      mouseDownRef.current = true;
      let position = getMousePosition(event);
      let shape = two.makePath([position], false);
      shape.fill = "#333";
      shape.stroke = "#333";
      shape.linewidth = 5;
      shape.vertices[0].addSelf(shape.translation);
      shape.translation.clear();
      shapeRef.current = shape;
    }
  }

  function handleMouseMove(event) {
    const shape = shapeRef.current;
    const two = twoRef.current;
    if (mouseDownRef.current && shape && two) {
      shape.vertices.push(getMousePosition(event));
      two.render();
    }
  }

  function handleMouseUp(event) {
    mouseDownRef.current = false;
  }

  return (
    <div
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}

export default MapDrawing;

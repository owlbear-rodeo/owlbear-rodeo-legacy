import React, { useState, useEffect, useRef } from "react";
import { Line, Group, Path, Circle } from "react-konva";
import { lerp } from "./shared";
import * as Vector2 from "./vector2";

// Holes should be wound in the opposite direction as the containing points array
export function HoleyLine({ holes, ...props }) {
  // Converted from https://github.com/rfestag/konva/blob/master/src/shapes/Line.ts
  function drawLine(points, context, shape) {
    const length = points.length;
    const tension = shape.tension();
    const closed = shape.closed();
    const bezier = shape.bezier();

    if (!length) {
      return;
    }

    context.moveTo(points[0], points[1]);

    if (tension !== 0 && length > 4) {
      const tensionPoints = shape.getTensionPoints();
      const tensionLength = tensionPoints.length;
      let n = closed ? 0 : 4;

      if (!closed) {
        context.quadraticCurveTo(
          tensionPoints[0],
          tensionPoints[1],
          tensionPoints[2],
          tensionPoints[3]
        );
      }

      while (n < tensionLength - 2) {
        context.bezierCurveTo(
          tensionPoints[n++],
          tensionPoints[n++],
          tensionPoints[n++],
          tensionPoints[n++],
          tensionPoints[n++],
          tensionPoints[n++]
        );
      }

      if (!closed) {
        context.quadraticCurveTo(
          tensionPoints[tensionLength - 2],
          tensionPoints[tensionLength - 1],
          points[length - 2],
          points[length - 1]
        );
      }
    } else if (bezier) {
      // no tension but bezier
      let n = 2;

      while (n < length) {
        context.bezierCurveTo(
          points[n++],
          points[n++],
          points[n++],
          points[n++],
          points[n++],
          points[n++]
        );
      }
    } else {
      // no tension
      for (let n = 2; n < length; n += 2) {
        context.lineTo(points[n], points[n + 1]);
      }
    }
  }

  // Draw points and holes
  function sceneFunc(context, shape) {
    const points = shape.points();
    const closed = shape.closed();

    if (!points.length) {
      return;
    }

    context.beginPath();
    drawLine(points, context, shape);

    context.beginPath();
    drawLine(points, context, shape);

    // closed e.g. polygons and blobs
    if (closed) {
      context.closePath();
      if (holes && holes.length) {
        for (let hole of holes) {
          drawLine(hole, context, shape);
          context.closePath();
        }
      }
      context.fillStrokeShape(shape);
    } else {
      // open e.g. lines and splines
      context.strokeShape(shape);
    }
  }

  return <Line sceneFunc={sceneFunc} {...props} />;
}

export function Tick({ x, y, scale, onClick, cross }) {
  const [fill, setFill] = useState("white");
  function handleEnter() {
    setFill("hsl(260, 100%, 80%)");
  }

  function handleLeave() {
    setFill("white");
  }
  return (
    <Group
      x={x}
      y={y}
      scaleX={scale}
      scaleY={scale}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
      onTap={onClick}
    >
      <Circle radius={12} fill="hsla(230, 25%, 18%, 0.8)" />
      <Path
        offsetX={12}
        offsetY={12}
        fill={fill}
        data={
          cross
            ? "M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"
            : "M9 16.2l-3.5-3.5c-.39-.39-1.01-.39-1.4 0-.39.39-.39 1.01 0 1.4l4.19 4.19c.39.39 1.02.39 1.41 0L20.3 7.7c.39-.39.39-1.01 0-1.4-.39-.39-1.01-.39-1.4 0L9 16.2z"
        }
      />
    </Group>
  );
}

export function Trail({ position, size, duration, segments }) {
  const trailRef = useRef();
  const pointsRef = useRef([]);
  const prevPositionRef = useRef(position);
  // Add a new point every time position is changed
  useEffect(() => {
    if (Vector2.compare(position, prevPositionRef.current, 0.0001)) {
      return;
    }
    pointsRef.current.push({ ...position, lifetime: duration });
    prevPositionRef.current = position;
  }, [position, duration]);

  // Advance lifetime of trail
  useEffect(() => {
    let prevTime = performance.now();
    let request = requestAnimationFrame(animate);
    function animate(time) {
      request = requestAnimationFrame(animate);
      const deltaTime = time - prevTime;
      prevTime = time;

      if (pointsRef.current.length === 0) {
        return;
      }

      let expired = 0;
      for (let point of pointsRef.current) {
        point.lifetime -= deltaTime;
        if (point.lifetime < 0) {
          expired++;
        }
      }
      if (expired > 0) {
        pointsRef.current = pointsRef.current.slice(
          expired,
          pointsRef.current.length
        );
      }
      if (trailRef.current) {
        trailRef.current.getLayer().draw();
      }
    }

    return () => {
      cancelAnimationFrame(request);
    };
  }, []);

  // Custom scene function for drawing a trail from a line
  function sceneFunc(context) {
    // Resample points to ensure a smooth trail
    const resampledPoints = Vector2.resample(pointsRef.current, segments);
    for (let i = 1; i < resampledPoints.length; i++) {
      const from = resampledPoints[i - 1];
      const to = resampledPoints[i];
      const alpha = i / resampledPoints.length;
      context.beginPath();
      context.lineJoin = "round";
      context.lineCap = "round";
      context.lineWidth = alpha * size;
      context.strokeStyle = `hsl(0, 63%, ${lerp(90, 50, alpha)}%)`;
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      context.closePath();
    }
  }

  return (
    <Group>
      <Line sceneFunc={sceneFunc} ref={trailRef} />
      <Circle
        x={position.x}
        y={position.y}
        fill="hsl(0, 63%, 50%)"
        width={size}
        height={size}
      />
    </Group>
  );
}

Trail.defaultProps = {
  // Duration of each point in milliseconds
  duration: 200,
  // Number of segments in the trail, resampled from the points
  segments: 50,
};

export function getRelativePointerPosition(node) {
  let transform = node.getAbsoluteTransform().copy();
  transform.invert();
  let posision = node.getStage().getPointerPosition();
  return transform.point(posision);
}

export function getRelativePointerPositionNormalized(node) {
  const relativePosition = getRelativePointerPosition(node);
  return {
    x: relativePosition.x / node.width(),
    y: relativePosition.y / node.height(),
  };
}

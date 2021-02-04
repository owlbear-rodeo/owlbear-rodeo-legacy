import React, { useState, useEffect, useRef } from "react";
import { Line, Group, Path, Circle } from "react-konva";
import Color from "color";
import Vector2 from "./Vector2";

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

export function Trail({ position, size, duration, segments, color }) {
  const trailRef = useRef();
  const pointsRef = useRef([]);
  const prevPositionRef = useRef(position);
  const positionRef = useRef(position);
  const circleRef = useRef();
  // Color of the end of the trial
  const transparentColorRef = useRef(
    Color(color).lighten(0.5).alpha(0).string()
  );

  useEffect(() => {
    // Lighten color to give it a `glow` effect
    transparentColorRef.current = Color(color).lighten(0.5).alpha(0).string();
  }, [color]);

  // Keep track of position so we can use it in the trail animation
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

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
        pointsRef.current = pointsRef.current.slice(expired);
      }

      // Update the circle position to keep it in sync with the trail
      if (circleRef.current) {
        circleRef.current.x(positionRef.current.x);
        circleRef.current.y(positionRef.current.y);
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
    if (resampledPoints.length === 0) {
      return;
    }
    // Draws a line offset in the direction perpendicular to its travel direction
    const drawOffsetLine = (from, to, alpha) => {
      const forward = Vector2.normalize(Vector2.subtract(from, to));
      // Rotate the forward vector 90 degrees based off of the direction
      const side = { x: forward.y, y: -forward.x };

      // Offset the `to` position by the size of the point and in the side direction
      const toSize = (alpha * size) / 2;
      const toOffset = Vector2.add(to, Vector2.multiply(side, toSize));

      context.lineTo(toOffset.x, toOffset.y);
    };
    context.beginPath();
    // Sample the points starting from the tail then traverse counter clockwise drawing each point
    // offset to make a taper, stops at the base of the trail
    context.moveTo(resampledPoints[0].x, resampledPoints[0].y);
    for (let i = 1; i < resampledPoints.length; i++) {
      const from = resampledPoints[i - 1];
      const to = resampledPoints[i];
      drawOffsetLine(from, to, i / resampledPoints.length);
    }
    // Start from the base of the trail and continue drawing down back to the end of the tail
    for (let i = resampledPoints.length - 2; i >= 0; i--) {
      const from = resampledPoints[i + 1];
      const to = resampledPoints[i];
      drawOffsetLine(from, to, i / resampledPoints.length);
    }
    context.lineTo(resampledPoints[0].x, resampledPoints[0].y);
    context.closePath();

    // Create a radial gradient from the center of the trail to the tail
    const gradientCenter = resampledPoints[resampledPoints.length - 1];
    const gradientEnd = resampledPoints[0];
    const gradientRadius = Vector2.length(
      Vector2.subtract(gradientCenter, gradientEnd)
    );
    let gradient = context.createRadialGradient(
      gradientCenter.x,
      gradientCenter.y,
      0,
      gradientCenter.x,
      gradientCenter.y,
      gradientRadius
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, transparentColorRef.current);
    context.fillStyle = gradient;
    context.fill();
  }

  return (
    <Group>
      <Line sceneFunc={sceneFunc} ref={trailRef} />
      <Circle
        x={position.x}
        y={position.y}
        fill={color}
        width={size}
        height={size}
        ref={circleRef}
      />
    </Group>
  );
}

Trail.defaultProps = {
  // Duration of each point in milliseconds
  duration: 200,
  // Number of segments in the trail, resampled from the points
  segments: 20,
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

/**
 * Converts points from alternating array form to vector array form
 * @param {number[]} points points in an x, y alternating array
 * @returns {Vector2[]} a `Vector2` array
 */
export function convertPointArray(points) {
  return points.reduce((acc, _, i, arr) => {
    if (i % 2 === 0) {
      acc.push({ x: arr[i], y: arr[i + 1] });
    }
    return acc;
  }, []);
}

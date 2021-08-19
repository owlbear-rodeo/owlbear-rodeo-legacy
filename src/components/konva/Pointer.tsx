import Color from "color";
import Konva from "konva";
import { useEffect, useRef } from "react";
import { Circle, Group, Line } from "react-konva";
import Vector2 from "../../helpers/Vector2";

interface PointerPoint extends Vector2 {
  lifetime: number;
}

type PointerProps = {
  position: Vector2;
  size: number;
  duration: number;
  segments: number;
  color: string;
};

function Pointer({ position, size, duration, segments, color }: PointerProps) {
  const trailRef = useRef<Konva.Line>(null);
  const pointsRef = useRef<PointerPoint[]>([]);
  const prevPositionRef = useRef(position);
  const positionRef = useRef(position);
  const circleRef = useRef<Konva.Circle>(null);
  // Color of the end of the trail
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
    function animate(time: number) {
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
      if (circleRef && circleRef.current) {
        circleRef.current.x(positionRef.current.x);
        circleRef.current.y(positionRef.current.y);
      }

      if (trailRef && trailRef.current) {
        trailRef.current.getLayer()?.draw();
      }
    }

    return () => {
      cancelAnimationFrame(request);
    };
  }, []);

  // Custom scene function for drawing a trail from a line
  function sceneFunc(context: Konva.Context) {
    // Resample points to ensure a smooth trail
    const resampledPoints = Vector2.resample(pointsRef.current, segments);
    if (resampledPoints.length === 0) {
      return;
    }
    // Draws a line offset in the direction perpendicular to its travel direction
    const drawOffsetLine = (from: Vector2, to: Vector2, alpha: number) => {
      const forward = Vector2.normalize(Vector2.subtract(from, to));
      // Rotate the forward vector 90 degrees based off of the direction
      const side = Vector2.rotate90(forward);

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
    const gradientRadius = Vector2.magnitude(
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
    // @ts-ignore
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

Pointer.defaultProps = {
  // Duration of each point in milliseconds
  duration: 200,
  // Number of segments in the trail, resampled from the points
  segments: 20,
};

export default Pointer;

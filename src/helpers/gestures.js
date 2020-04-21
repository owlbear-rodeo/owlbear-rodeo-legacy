import ShapeDetector from "shape-detector";
import simplify from "simplify-js";
import { normalize, subtract, dot, length } from "./vector2";

import gestures from "./gesturesData";

const detector = new ShapeDetector(gestures);

export function pointsToGesture(points) {
  return detector.spot(points).pattern;
}

export function getBounds(points) {
  let minX = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let minY = Number.MAX_VALUE;
  let maxY = Number.MIN_VALUE;
  for (let point of points) {
    minX = point.x < minX ? point.x : minX;
    maxX = point.x > maxX ? point.x : maxX;
    minY = point.y < minY ? point.y : minY;
    maxY = point.y > maxY ? point.y : maxY;
  }
  return { minX, maxX, minY, maxY };
}

function getTrianglePoints(points) {
  if (points.length < 3) {
    return points;
  }

  // Simplify edges up to the average distance between points
  let perimeterDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    perimeterDistance += length(subtract(points[i + 1], points[i]));
  }
  const averagePointDistance = perimeterDistance / points.length;
  const simplifiedPoints = simplify(points, averagePointDistance);

  const edges = [];
  // Find edges of the simplified points that have the highest angular change
  for (let i = 0; i < simplifiedPoints.length; i++) {
    // Ensure index loops over to start and end of erray
    const prevIndex = i - 1 < 0 ? simplifiedPoints.length - i - 1 : i - 1;
    const nextIndex = (i + 1) % simplifiedPoints.length;

    const prev = normalize(
      subtract(simplifiedPoints[i], simplifiedPoints[prevIndex])
    );
    const next = normalize(
      subtract(simplifiedPoints[nextIndex], simplifiedPoints[i])
    );

    const similarity = dot(prev, next);
    if (similarity < 0.25) {
      edges.push({ similarity, point: simplifiedPoints[i] });
    }
  }

  edges.sort((a, b) => a.similarity - b.similarity);
  const trianglePoints = edges.slice(0, 3).map((edge) => edge.point);
  // Return the points with the highest angular change or fallback to a heuristic
  if (trianglePoints.length === 3) {
    return trianglePoints;
  } else {
    return [
      { x: points[0].x, y: points[0].y },
      {
        x: points[Math.floor(points.length / 2)].x,
        y: points[Math.floor(points.length / 2)].y,
      },
      { x: points[points.length - 1].x, y: points[points.length - 1].y },
    ];
  }
}

export function gestureToData(points, gesture) {
  const bounds = getBounds(points);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const maxSide = width > height ? width : height;
  switch (gesture) {
    case "rectangle":
      return { x: bounds.minX, y: bounds.minY, width, height };
    case "triangle":
      return {
        points: getTrianglePoints(points),
      };
    case "circle":
      return {
        x: bounds.minX + width / 2,
        y: bounds.minY + height / 2,
        radius: maxSide / 2,
      };
    default:
      throw Error("Gesture not implemented");
  }
}

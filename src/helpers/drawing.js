import simplify from "simplify-js";
import polygonClipping from "polygon-clipping";

import Vector2 from "./Vector2";
import { toDegrees } from "./shared";
import { logError } from "./logging";

export function getDefaultShapeData(type, brushPosition) {
  if (type === "line") {
    return {
      points: [
        { x: brushPosition.x, y: brushPosition.y },
        { x: brushPosition.x, y: brushPosition.y },
      ],
    };
  } else if (type === "circle") {
    return { x: brushPosition.x, y: brushPosition.y, radius: 0 };
  } else if (type === "rectangle") {
    return {
      x: brushPosition.x,
      y: brushPosition.y,
      width: 0,
      height: 0,
    };
  } else if (type === "triangle") {
    return {
      points: [
        { x: brushPosition.x, y: brushPosition.y },
        { x: brushPosition.x, y: brushPosition.y },
        { x: brushPosition.x, y: brushPosition.y },
      ],
    };
  }
}

export function getGridScale(cellSize) {
  if (cellSize.x < cellSize.y) {
    return { x: cellSize.y / cellSize.x, y: 1 };
  } else if (cellSize.y < cellSize.x) {
    return { x: 1, y: cellSize.x / cellSize.y };
  } else {
    return { x: 1, y: 1 };
  }
}

export function getUpdatedShapeData(
  type,
  data,
  brushPosition,
  gridCellNormalizedSize
) {
  const gridScale = getGridScale(gridCellNormalizedSize);
  if (type === "line") {
    return {
      points: [data.points[0], { x: brushPosition.x, y: brushPosition.y }],
    };
  } else if (type === "circle") {
    const dif = Vector2.subtract(brushPosition, {
      x: data.x,
      y: data.y,
    });
    const scaled = Vector2.multiply(dif, gridScale);
    const distance = Vector2.length(scaled);
    return {
      ...data,
      radius: distance,
    };
  } else if (type === "rectangle") {
    const dif = Vector2.subtract(brushPosition, { x: data.x, y: data.y });
    return {
      ...data,
      width: dif.x,
      height: dif.y,
    };
  } else if (type === "triangle") {
    const points = data.points;
    const dif = Vector2.subtract(brushPosition, points[0]);
    // Scale the distance by the grid scale then unscale before adding
    const scaled = Vector2.multiply(dif, gridScale);
    const length = Vector2.length(scaled);
    const direction = Vector2.normalize(scaled);
    // Get the angle for a triangle who's width is the same as it's length
    const angle = Math.atan(length / 2 / (length === 0 ? 1 : length));
    const sideLength = length / Math.cos(angle);

    const leftDir = Vector2.rotateDirection(direction, toDegrees(angle));
    const rightDir = Vector2.rotateDirection(direction, -toDegrees(angle));

    const leftDirUnscaled = Vector2.divide(leftDir, gridScale);
    const rightDirUnscaled = Vector2.divide(rightDir, gridScale);

    return {
      points: [
        points[0],
        Vector2.add(Vector2.multiply(leftDirUnscaled, sideLength), points[0]),
        Vector2.add(Vector2.multiply(rightDirUnscaled, sideLength), points[0]),
      ],
    };
  }
}

const defaultStrokeWidth = 1 / 10;
export function getStrokeWidth(multiplier, gridSize, mapWidth, mapHeight) {
  const gridPixelSize = Vector2.multiply(gridSize, {
    x: mapWidth,
    y: mapHeight,
  });
  return Vector2.min(gridPixelSize) * defaultStrokeWidth * multiplier;
}

const defaultSimplifySize = 1 / 100;
export function simplifyPoints(points, gridCellNormalizedSize, scale) {
  return simplify(
    points,
    (Vector2.min(gridCellNormalizedSize) * defaultSimplifySize) / scale
  );
}

export function mergeShapes(shapes) {
  if (shapes.length === 0) {
    return shapes;
  }
  let geometries = [];
  for (let shape of shapes) {
    if (!shape.visible) {
      continue;
    }
    const shapePoints = shape.data.points.map(({ x, y }) => [x, y]);
    const shapeHoles = shape.data.holes.map((hole) =>
      hole.map(({ x, y }) => [x, y])
    );
    let shapeGeom = [[shapePoints, ...shapeHoles]];
    geometries.push(shapeGeom);
  }
  if (geometries.length === 0) {
    return geometries;
  }
  try {
    let union = polygonClipping.union(...geometries);
    let merged = [];
    for (let i = 0; i < union.length; i++) {
      let holes = [];
      if (union[i].length > 1) {
        for (let j = 1; j < union[i].length; j++) {
          holes.push(union[i][j].map(([x, y]) => ({ x, y })));
        }
      }
      merged.push({
        // Use the data of the first visible shape as the merge
        ...shapes.find((shape) => shape.visible),
        id: `merged-${i}`,
        data: {
          points: union[i][0].map(([x, y]) => ({ x, y })),
          holes,
        },
      });
    }
    return merged;
  } catch {
    logError(new Error(`Unable to merge shapes ${JSON.stringify(shapes)}`));
    return shapes;
  }
}

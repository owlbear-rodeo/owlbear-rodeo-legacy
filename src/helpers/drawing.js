import simplify from "simplify-js";
import polygonClipping from "polygon-clipping";

import Vector2 from "./Vector2";
import { toDegrees } from "./shared";
import { getRelativePointerPositionNormalized } from "./konva";
import { logError } from "./logging";

const snappingThreshold = 1 / 5;
export function getBrushPosition(
  map,
  mapStage,
  useGridSnappning,
  gridCellNormalizedSize
) {
  const mapImage = mapStage.findOne("#mapImage");
  let position = getRelativePointerPositionNormalized(mapImage);
  if (useGridSnappning) {
    // Snap to corners of grid
    // Subtract offset to transform into offset space then add it back transform back
    const offset = map.grid.inset.topLeft;
    const gridSnap = Vector2.add(
      Vector2.roundTo(
        Vector2.subtract(position, offset),
        gridCellNormalizedSize
      ),
      offset
    );
    const gridDistance = Vector2.length(Vector2.subtract(gridSnap, position));
    // Snap to center of grid
    // Subtract offset and half size to transform it into offset half space then transform it back
    const halfSize = Vector2.multiply(gridCellNormalizedSize, 0.5);
    const centerSnap = Vector2.add(
      Vector2.add(
        Vector2.roundTo(
          Vector2.subtract(Vector2.subtract(position, offset), halfSize),
          gridCellNormalizedSize
        ),
        halfSize
      ),
      offset
    );
    const centerDistance = Vector2.length(
      Vector2.subtract(centerSnap, position)
    );
    const minGrid = Vector2.min(gridCellNormalizedSize);
    if (gridDistance < minGrid * snappingThreshold) {
      position = gridSnap;
    } else if (centerDistance < minGrid * snappingThreshold) {
      position = centerSnap;
    }
  }
  return position;
}

export function getFogBrushPosition(
  map,
  mapStage,
  useGridSnappning,
  gridCellNormalizedSize,
  useEdgeSnapping,
  fogShapes,
  rectPoints
) {
  let position = getBrushPosition(
    map,
    mapStage,
    useGridSnappning,
    gridCellNormalizedSize
  );
  if (useEdgeSnapping) {
    const minGrid = Vector2.min(gridCellNormalizedSize);
    let closestDistance = Number.MAX_VALUE;
    let closestPosition = position;
    // Find the closest point on all fog shapes
    for (let shape of fogShapes) {
      // Include shape points and holes
      let pointArray = [shape.data.points, ...shape.data.holes];

      for (let points of pointArray) {
        // Find the closest point to each line of the shape
        for (let i = 0; i < points.length; i++) {
          const a = points[i];
          // Wrap around points to the start to account for closed shape
          const b = points[(i + 1) % points.length];

          let {
            distance: distanceToLine,
            point: pointOnLine,
          } = Vector2.distanceToLine(position, a, b);

          if (rectPoints) {
            const { distance: d1, point: p1 } = Vector2.distanceToLine(
              { x: position.x, y: rectPoints[1].y },
              a,
              b
            );
            const { distance: d3, point: p3 } = Vector2.distanceToLine(
              { x: rectPoints[3].x, y: position.y },
              a,
              b
            );

            if (d1 < minGrid * snappingThreshold) {
              distanceToLine = d1;
              pointOnLine.x = p1.x;
            }
            if (d3 < minGrid * snappingThreshold) {
              distanceToLine = d3;
              pointOnLine.y = p3.y;
            }
          }

          const isCloseToShape = distanceToLine < minGrid * snappingThreshold;
          if (isCloseToShape && distanceToLine < closestDistance) {
            closestPosition = pointOnLine;
            closestDistance = distanceToLine;
          }
        }
      }
    }
    position = closestPosition;
  }
  return position;
}

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

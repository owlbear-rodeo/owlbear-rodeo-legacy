import simplify from "simplify-js";
import polygonClipping from "polygon-clipping";

import * as Vector2 from "./vector2";
import { toDegrees, omit } from "./shared";

const snappingThreshold = 1 / 5;
export function getBrushPositionForTool(
  brushPosition,
  tool,
  toolSettings,
  gridSize,
  shapes
) {
  let position = brushPosition;
  const useGridSnappning =
    (tool === "drawing" &&
      (toolSettings.type === "line" ||
        toolSettings.type === "rectangle" ||
        toolSettings.type === "circle" ||
        toolSettings.type === "triangle")) ||
    (tool === "fog" && toolSettings.type === "polygon");

  if (useGridSnappning) {
    // Snap to corners of grid
    const gridSnap = Vector2.roundTo(position, gridSize);
    const gridDistance = Vector2.length(Vector2.subtract(gridSnap, position));

    // Snap to center of grid
    const centerSnap = Vector2.add(
      Vector2.roundTo(position, gridSize),
      Vector2.multiply(gridSize, 0.5)
    );
    const centerDistance = Vector2.length(
      Vector2.subtract(centerSnap, position)
    );
    const minGrid = Vector2.min(gridSize);
    if (gridDistance < minGrid * snappingThreshold) {
      position = gridSnap;
    } else if (centerDistance < minGrid * snappingThreshold) {
      position = centerSnap;
    }
  }

  const useEdgeSnapping = tool === "fog" && toolSettings.useEdgeSnapping;

  if (useEdgeSnapping) {
    const minGrid = Vector2.min(gridSize);
    let closestDistance = Number.MAX_VALUE;
    let closestPosition = position;
    // Find the closest point on all fog shapes
    for (let shape of shapes) {
      if (shape.type === "fog") {
        // Include shape points and holes
        let pointArray = [shape.data.points, ...shape.data.holes];

        // Check whether the position is in the shape but not any holes
        let isInShape = Vector2.pointInPolygon(position, shape.data.points);
        if (shape.data.holes.length > 0) {
          for (let hole of shape.data.holes) {
            if (Vector2.pointInPolygon(position, hole)) {
              isInShape = false;
            }
          }
        }

        for (let points of pointArray) {
          // Find the closest point to each line of the shape
          for (let i = 0; i < points.length; i++) {
            const a = points[i];
            // Wrap around points to the start to account for closed shape
            const b = points[(i + 1) % points.length];

            const {
              distance: distanceToLine,
              point: pointOnLine,
            } = Vector2.distanceToLine(position, a, b);
            const isCloseToShape = distanceToLine < minGrid * snappingThreshold;
            if (
              (isInShape || isCloseToShape) &&
              distanceToLine < closestDistance
            ) {
              closestPosition = pointOnLine;
              closestDistance = distanceToLine;
            }
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

export function getGridScale(gridSize) {
  if (gridSize.x < gridSize.y) {
    return { x: gridSize.y / gridSize.x, y: 1 };
  } else if (gridSize.y < gridSize.x) {
    return { x: 1, y: gridSize.x / gridSize.y };
  } else {
    return { x: 1, y: 1 };
  }
}

export function getUpdatedShapeData(type, data, brushPosition, gridSize) {
  const gridScale = getGridScale(gridSize);
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
export function simplifyPoints(points, gridSize, scale) {
  return simplify(
    points,
    (Vector2.min(gridSize) * defaultSimplifySize) / scale
  );
}

export function drawActionsToShapes(actions, actionIndex) {
  let shapesById = {};
  for (let i = 0; i <= actionIndex; i++) {
    const action = actions[i];
    if (action.type === "add" || action.type === "edit") {
      for (let shape of action.shapes) {
        shapesById[shape.id] = shape;
      }
    }
    if (action.type === "remove") {
      shapesById = omit(shapesById, action.shapeIds);
    }
    if (action.type === "subtract") {
      const actionGeom = action.shapes.map((actionShape) => [
        actionShape.data.points.map(({ x, y }) => [x, y]),
      ]);
      let subtractedShapes = {};
      for (let shape of Object.values(shapesById)) {
        const shapePoints = shape.data.points.map(({ x, y }) => [x, y]);
        const shapeHoles = shape.data.holes.map((hole) =>
          hole.map(({ x, y }) => [x, y])
        );
        let shapeGeom = [[shapePoints, ...shapeHoles]];
        const difference = polygonClipping.difference(shapeGeom, actionGeom);
        for (let i = 0; i < difference.length; i++) {
          let newId = difference.length > 1 ? `${shape.id}-${i}` : shape.id;
          // Holes detected
          let holes = [];
          if (difference[i].length > 1) {
            for (let j = 1; j < difference[i].length; j++) {
              holes.push(difference[i][j].map(([x, y]) => ({ x, y })));
            }
          }

          subtractedShapes[newId] = {
            ...shape,
            id: newId,
            data: {
              points: difference[i][0].map(([x, y]) => ({ x, y })),
              holes,
            },
          };
        }
      }
      shapesById = subtractedShapes;
    }
  }
  return Object.values(shapesById);
}

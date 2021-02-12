import simplify from "simplify-js";
import polygonClipping from "polygon-clipping";

import Vector2 from "./Vector2";
import { toDegrees } from "./shared";
import { logError } from "./logging";
import { getNearestCellCoordinates, getCellLocation } from "./grid";

/**
 * @typedef PointsData
 * @property {Vector2[]} points
 */

/**
 * @typedef RectData
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef CircleData
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 */
/**
 * @typedef FogData
 * @property {Vector2[]} points
 * @property {Vector2[]} holes
 */

/**
 * @typedef {(PointsData|RectData|CircleData)} ShapeData
 */

/**
 * @typedef {("line"|"rectangle"|"circle"|"triangle")} ShapeType
 */

/**
 * @typedef {("fill"|"stroke")} PathType
 */

/**
 * @typedef Path
 * @property {boolean} blend
 * @property {string} color
 * @property {PointsData} data
 * @property {string} id
 * @property {PathType} pathType
 * @property {number} strokeWidth
 * @property {"path"} type
 */

/**
 * @typedef Shape
 * @property {boolean} blend
 * @property {string} color
 * @property {ShapeData} data
 * @property {string} id
 * @property {ShapeType} shapeType
 * @property {number} strokeWidth
 * @property {"shape"} type
 */

/**
 * @typedef Fog
 * @property {string} color
 * @property {FogData} data
 * @property {string} id
 * @property {number} strokeWidth
 * @property {"fog"} type
 * @property {boolean} visible
 */

/**
 *
 * @param {ShapeType} type
 * @param {Vector2} brushPosition
 * @returns {ShapeData}
 */
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

/**
 * @param {Vector2} cellSize
 * @returns {Vector2}
 */
export function getGridCellRatio(cellSize) {
  if (cellSize.x < cellSize.y) {
    return { x: cellSize.y / cellSize.x, y: 1 };
  } else if (cellSize.y < cellSize.x) {
    return { x: 1, y: cellSize.x / cellSize.y };
  } else {
    return { x: 1, y: 1 };
  }
}

/**
 *
 * @param {ShapeType} type
 * @param {ShapeData} data
 * @param {Vector2} brushPosition
 * @param {Vector2} gridCellNormalizedSize
 * @returns {ShapeData}
 */
export function getUpdatedShapeData(
  type,
  data,
  brushPosition,
  gridCellNormalizedSize,
  mapWidth,
  mapHeight
) {
  if (type === "line") {
    return {
      points: [data.points[0], { x: brushPosition.x, y: brushPosition.y }],
    };
  } else if (type === "circle") {
    const gridRatio = getGridCellRatio(gridCellNormalizedSize);
    const dif = Vector2.subtract(brushPosition, {
      x: data.x,
      y: data.y,
    });
    const scaled = Vector2.multiply(dif, gridRatio);
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
    // Convert to absolute coordinates
    const mapSize = { x: mapWidth, y: mapHeight };
    const brushPositionPixel = Vector2.multiply(brushPosition, mapSize);

    const points = data.points;
    const startPixel = Vector2.multiply(points[0], mapSize);
    const dif = Vector2.subtract(brushPositionPixel, startPixel);
    const length = Vector2.length(dif);
    const direction = Vector2.normalize(dif);
    // Get the angle for a triangle who's width is the same as it's length
    const angle = Math.atan(length / 2 / (length === 0 ? 1 : length));
    const sideLength = length / Math.cos(angle);

    const leftDir = Vector2.rotateDirection(direction, toDegrees(angle));
    const rightDir = Vector2.rotateDirection(direction, -toDegrees(angle));

    // Convert back to normalized coordinates
    const leftDirNorm = Vector2.divide(leftDir, mapSize);
    const rightDirNorm = Vector2.divide(rightDir, mapSize);

    return {
      points: [
        points[0],
        Vector2.add(Vector2.multiply(leftDirNorm, sideLength), points[0]),
        Vector2.add(Vector2.multiply(rightDirNorm, sideLength), points[0]),
      ],
    };
  }
}

const defaultSimplifySize = 1 / 100;
/**
 * Simplify points to a grid size
 * @param {Vector2[]} points
 * @param {Vector2} gridCellSize
 * @param {number} scale
 */
export function simplifyPoints(points, gridCellSize, scale) {
  return simplify(
    points,
    (Vector2.min(gridCellSize) * defaultSimplifySize) / scale
  );
}

/**
 * Merges overlapping fog shapes
 * @param {Fog[]} shapes
 * @returns {Fog[]}
 */
export function mergeFogShapes(shapes) {
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

/**
 * @param {Fog[]} shapes
 * @returns {Vector2.BoundingBox[]}
 */
export function getFogShapesBoundingBoxes(shapes) {
  let boxes = [];
  for (let shape of shapes) {
    boxes.push(Vector2.getBoundingBox(shape.data.points));
  }
  return boxes;
}

/**
 * @typedef Edge
 * @property {Vector2} start
 * @property {Vector2} end
 */

/**
 * @typedef Guide
 * @property {Vector2} start
 * @property {Vector2} end
 * @property {("horizontal"|"vertical")} orientation
 * @property {number}
 */

/**
 * @param {Vector2} brushPosition Brush position in pixels
 * @param {Vector2} grid
 * @param {Vector2} gridCellSize Grid cell size in pixels
 * @param {Vector2} gridOffset
 * @param {Vector2} gridCellOffset
 * @param {number} snappingSensitivity
 * @param {Vector2} mapSize
 * @returns {Guide[]}
 */
export function getGuidesFromGridCell(
  brushPosition,
  grid,
  gridCellSize,
  gridOffset,
  gridCellOffset,
  snappingSensitivity,
  mapSize
) {
  let boundingBoxes = [];
  // Add map bounds
  boundingBoxes.push(
    Vector2.getBoundingBox([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ])
  );
  let offsetPosition = Vector2.subtract(
    Vector2.subtract(brushPosition, gridOffset),
    gridCellOffset
  );
  const cellCoords = getNearestCellCoordinates(
    grid,
    offsetPosition.x,
    offsetPosition.y,
    gridCellSize
  );
  let cellPosition = getCellLocation(
    grid,
    cellCoords.x,
    cellCoords.y,
    gridCellSize
  );
  cellPosition = Vector2.add(
    Vector2.add(cellPosition, gridOffset),
    gridCellOffset
  );
  // Normalize values so output is normalized
  cellPosition = Vector2.divide(cellPosition, mapSize);
  const gridCellNormalizedSize = Vector2.divide(gridCellSize, mapSize);
  const brushPositionNorm = Vector2.divide(brushPosition, mapSize);
  const boundingBox = Vector2.getBoundingBox([
    {
      x: cellPosition.x - gridCellNormalizedSize.x / 2,
      y: cellPosition.y - gridCellNormalizedSize.y / 2,
    },
    {
      x: cellPosition.x + gridCellNormalizedSize.x / 2,
      y: cellPosition.y + gridCellNormalizedSize.y / 2,
    },
  ]);
  boundingBoxes.push(boundingBox);
  return getGuidesFromBoundingBoxes(
    brushPositionNorm,
    boundingBoxes,
    gridCellNormalizedSize,
    snappingSensitivity
  );
}

/**
 * @param {Vector2} brushPosition
 * @param {Vector2.BoundingBox[]} boundingBoxes
 * @param {Vector2} gridCellSize
 * @param {number} snappingSensitivity
 * @returns {Guide[]}
 */
export function getGuidesFromBoundingBoxes(
  brushPosition,
  boundingBoxes,
  gridCellSize,
  snappingSensitivity
) {
  let horizontalEdges = [];
  let verticalEdges = [];
  for (let bounds of boundingBoxes) {
    horizontalEdges.push({
      start: { x: bounds.min.x, y: bounds.min.y },
      end: { x: bounds.max.x, y: bounds.min.y },
    });
    horizontalEdges.push({
      start: { x: bounds.min.x, y: bounds.center.y },
      end: { x: bounds.max.x, y: bounds.center.y },
    });
    horizontalEdges.push({
      start: { x: bounds.min.x, y: bounds.max.y },
      end: { x: bounds.max.x, y: bounds.max.y },
    });

    verticalEdges.push({
      start: { x: bounds.min.x, y: bounds.min.y },
      end: { x: bounds.min.x, y: bounds.max.y },
    });
    verticalEdges.push({
      start: { x: bounds.center.x, y: bounds.min.y },
      end: { x: bounds.center.x, y: bounds.max.y },
    });
    verticalEdges.push({
      start: { x: bounds.max.x, y: bounds.min.y },
      end: { x: bounds.max.x, y: bounds.max.y },
    });
  }
  let guides = [];
  for (let edge of verticalEdges) {
    const distance = Math.abs(brushPosition.x - edge.start.x);
    if (distance / gridCellSize.x < snappingSensitivity) {
      guides.push({ ...edge, distance, orientation: "vertical" });
    }
  }
  for (let edge of horizontalEdges) {
    const distance = Math.abs(brushPosition.y - edge.start.y);
    if (distance / gridCellSize.y < snappingSensitivity) {
      guides.push({ ...edge, distance, orientation: "horizontal" });
    }
  }
  return guides;
}

/**
 * @param {Vector2} brushPosition
 * @param {Guide[]} guides
 * @returns {Guide[]}
 */
export function findBestGuides(brushPosition, guides) {
  let bestGuides = [];
  let verticalGuide = guides
    .filter((guide) => guide.orientation === "vertical")
    .sort((a, b) => a.distance - b.distance)[0];
  let horizontalGuide = guides
    .filter((guide) => guide.orientation === "horizontal")
    .sort((a, b) => a.distance - b.distance)[0];

  // Offset edges to match brush position
  if (verticalGuide && !horizontalGuide) {
    verticalGuide.start.y = Math.min(verticalGuide.start.y, brushPosition.y);
    verticalGuide.end.y = Math.max(verticalGuide.end.y, brushPosition.y);
    bestGuides.push(verticalGuide);
  }
  if (horizontalGuide && !verticalGuide) {
    horizontalGuide.start.x = Math.min(
      horizontalGuide.start.x,
      brushPosition.x
    );
    horizontalGuide.end.x = Math.max(horizontalGuide.end.x, brushPosition.x);
    bestGuides.push(horizontalGuide);
  }
  if (horizontalGuide && verticalGuide) {
    verticalGuide.start.y = Math.min(
      verticalGuide.start.y,
      horizontalGuide.start.y
    );
    verticalGuide.end.y = Math.max(
      verticalGuide.end.y,
      horizontalGuide.start.y
    );

    horizontalGuide.start.x = Math.min(
      horizontalGuide.start.x,
      verticalGuide.start.x
    );
    horizontalGuide.end.x = Math.max(
      horizontalGuide.end.x,
      verticalGuide.start.x
    );

    bestGuides.push(horizontalGuide);
    bestGuides.push(verticalGuide);
  }
  return bestGuides;
}

/**
 * @param {Vector2} brushPosition
 * @param {Fog[]} shapes
 * @param {Vector2.BoundingBox} boundingBoxes
 * @param {Vector2} gridCellSize
 * @param {number} snappingSensitivity
 */
export function getSnappingVertex(
  brushPosition,
  shapes,
  boundingBoxes,
  gridCellSize,
  snappingSensitivity
) {
  const minGrid = Vector2.min(gridCellSize);
  const snappingDistance = minGrid * snappingSensitivity;

  let closestDistance = Number.MAX_VALUE;
  let closestPosition;
  for (let i = 0; i < shapes.length; i++) {
    // Check bounds before checking all points
    const bounds = boundingBoxes[i];
    const offsetMin = Vector2.subtract(bounds.min, gridCellSize);
    const offsetMax = Vector2.add(bounds.max, gridCellSize);
    if (
      brushPosition.x < offsetMin.x ||
      brushPosition.x > offsetMax.x ||
      brushPosition.y < offsetMin.y ||
      brushPosition.y > offsetMax.y
    ) {
      continue;
    }
    const shape = shapes[i];
    // Include shape points and holes
    let pointArray = [shape.data.points, ...shape.data.holes];

    for (let points of pointArray) {
      // Find the closest point to each edge of the shape
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        // Wrap around points to the start to account for closed shape
        const b = points[(i + 1) % points.length];

        let { distance, point } = Vector2.distanceToLine(brushPosition, a, b);
        // Bias towards vertices
        distance += snappingDistance / 2;
        const isCloseToShape = distance < snappingDistance;
        if (isCloseToShape && distance < closestDistance) {
          closestPosition = point;
          closestDistance = distance;
        }
      }
      // Find cloest vertex
      for (let point of points) {
        const distance = Vector2.distance(point, brushPosition);
        const isCloseToShape = distance < snappingDistance;
        if (isCloseToShape && distance < closestDistance) {
          closestPosition = point;
          closestDistance = distance;
        }
      }
    }
  }
  return closestPosition;
}

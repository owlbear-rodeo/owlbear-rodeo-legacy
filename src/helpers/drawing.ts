import simplify from "simplify-js";
import polygonClipping, { Geom, Polygon, Ring } from "polygon-clipping";

import Vector2, { BoundingBox } from "./Vector2";
import Size from "./Size"
import { toDegrees } from "./shared";
import { Grid, getNearestCellCoordinates, getCellLocation } from "./grid";

/**
 * @typedef PointsData
 * @property {Vector2[]} points
 */

type PointsData = {
  points: Vector2[]
}

/**
 * @typedef RectData
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

type RectData = {
  x: number,
  y: number, 
  width: number, 
  height: number
}

/**
 * @typedef CircleData
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 */

type CircleData = {
  x: number, 
  y: number, 
  radius: number
}

/**
 * @typedef FogData
 * @property {Vector2[]} points
 * @property {Vector2[][]} holes
 */

type FogData = {
  points: Vector2[]
  holes: Vector2[][]
}

/**
 * @typedef {(PointsData|RectData|CircleData)} ShapeData
 */

type ShapeData = PointsData | RectData | CircleData

/**
 * @typedef {("line"|"rectangle"|"circle"|"triangle")} ShapeType
 */

type ShapeType = "line" | "rectangle" | "circle" | "triangle"

/**
 * @typedef {("fill"|"stroke")} PathType
 */

type PathType = "fill" | "stroke"

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

export type Path = {
  blend: boolean, 
  color: string, 
  data: PointsData,
  id: string, 
  pathType: PathType, 
  strokeWidth: number, 
  type: "path"
}

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

export type Shape = {
  blend: boolean, 
  color: string, 
  data: ShapeData, 
  id: string, 
  shapeType: ShapeType, 
  strokeWidth: number, 
  type: "shape"
}

/**
 * @typedef Fog
 * @property {string} color
 * @property {FogData} data
 * @property {string} id
 * @property {number} strokeWidth
 * @property {"fog"} type
 * @property {boolean} visible
 */

export type Fog = {
  color: string, 
  data: FogData, 
  id: string, 
  strokeWidth: number, 
  type: "fog", 
  visible: boolean
}

/**
 *
 * @param {ShapeType} type
 * @param {Vector2} brushPosition
 * @returns {ShapeData}
 */
export function getDefaultShapeData(type: ShapeType, brushPosition: Vector2): ShapeData | undefined{
  // TODO: handle undefined if no type found
  if (type === "line") {
    return {
      points: [
        { x: brushPosition.x, y: brushPosition.y },
        { x: brushPosition.x, y: brushPosition.y },
      ],
    } as PointsData;
  } else if (type === "circle") {
    return { x: brushPosition.x, y: brushPosition.y, radius: 0 } as CircleData;
  } else if (type === "rectangle") {
    return {
      x: brushPosition.x,
      y: brushPosition.y,
      width: 0,
      height: 0,
    } as RectData;
  } else if (type === "triangle") {
    return {
      points: [
        { x: brushPosition.x, y: brushPosition.y },
        { x: brushPosition.x, y: brushPosition.y },
        { x: brushPosition.x, y: brushPosition.y },
      ],
    } as PointsData;
  }
}

/**
 * @param {Vector2} cellSize
 * @returns {Vector2}
 */
export function getGridCellRatio(cellSize: Vector2): Vector2 {
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
  type: ShapeType,
  data: ShapeData,
  brushPosition: Vector2,
  gridCellNormalizedSize: Vector2,
  mapWidth: number,
  mapHeight: number
): ShapeData | undefined {
  // TODO: handle undefined type
  if (type === "line") {
    data = data as PointsData;
    return {
      points: [data.points[0], { x: brushPosition.x, y: brushPosition.y }],
    } as PointsData;
  } else if (type === "circle") {
    data = data as CircleData; 
    const gridRatio = getGridCellRatio(gridCellNormalizedSize);
    const dif = Vector2.subtract(brushPosition, {
      x: data.x,
      y: data.y,
    });
    const scaled = Vector2.multiply(dif, gridRatio);
    const distance = Vector2.setLength(scaled);
    return {
      ...data,
      radius: distance,
    };
  } else if (type === "rectangle") {
    data = data as RectData;
    const dif = Vector2.subtract(brushPosition, { x: data.x, y: data.y });
    return {
      ...data,
      width: dif.x,
      height: dif.y,
    };
  } else if (type === "triangle") {
    data = data as PointsData;
    // Convert to absolute coordinates
    const mapSize = { x: mapWidth, y: mapHeight };
    const brushPositionPixel = Vector2.multiply(brushPosition, mapSize);

    const points = data.points;
    const startPixel = Vector2.multiply(points[0], mapSize);
    const dif = Vector2.subtract(brushPositionPixel, startPixel);
    const length = Vector2.setLength(dif);
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
export function simplifyPoints(points: Vector2[], gridCellSize: Vector2, scale: number): any {
  return simplify(
    points,
    (Vector2.min(gridCellSize) as number * defaultSimplifySize) / scale
  );
}

/**
 * Merges overlapping fog shapes
 * @param {Fog[]} shapes
 * @param {boolean} ignoreHidden
 * @returns {Fog[]}
 */
export function mergeFogShapes(shapes: Fog[], ignoreHidden: boolean = true): Fog[] {
  if (shapes.length === 0) {
    return shapes;
  }
  let geometries: Geom[] = [];
  for (let shape of shapes) {
    if (ignoreHidden && !shape.visible) {
      continue;
    }
    const shapePoints: Ring = shape.data.points.map(({ x, y }) => [x, y]);
    const shapeHoles: Polygon = shape.data.holes.map((hole) =>
      hole.map(({ x, y }: { x: number, y: number }) => [x, y])
    );
    let shapeGeom: Geom = [[shapePoints, ...shapeHoles]];
    geometries.push(shapeGeom);
  }
  if (geometries.length === 0) {
    return [];
  }
  try {
    let union = polygonClipping.union(geometries[0], ...geometries.slice(1));
    let merged: Fog[] = [];
    for (let i = 0; i < union.length; i++) {
      let holes: Vector2[][] = [];
      if (union[i].length > 1) {
        for (let j = 1; j < union[i].length; j++) {
          holes.push(union[i][j].map(([x, y]) => ({ x, y })));
        }
      }
      // find the first visible shape
      let visibleShape = shapes.find((shape) => ignoreHidden || shape.visible);
      if (!visibleShape) {
        // TODO: handle if visible shape not found
        throw Error;
      }
      merged.push({
        // Use the data of the first visible shape as the merge
        ...visibleShape,
        id: `merged-${i}`,
        data: {
          points: union[i][0].map(([x, y]) => ({ x, y })),
          holes,
        },
        type: "fog"
      });
    }
    return merged;
  } catch {
    console.error("Unable to merge shapes");
    return shapes;
  }
}

/**
 * @param {Fog[]} shapes
 * @param {boolean} maxPoints Max amount of points per shape to get bounds for
 * @returns {Vector2.BoundingBox[]}
 */
export function getFogShapesBoundingBoxes(shapes: Fog[], maxPoints = 0): BoundingBox[] {
  let boxes = [];
  for (let shape of shapes) {
    if (maxPoints > 0 && shape.data.points.length > maxPoints) {
      continue;
    }
    boxes.push(Vector2.getBoundingBox(shape.data.points));
  }
  return boxes;
}

/**
 * @typedef Edge
 * @property {Vector2} start
 * @property {Vector2} end
 */

// type Edge = {
//   start: Vector2,
//   end: Vector2
// }

/**
 * @typedef Guide
 * @property {Vector2} start
 * @property {Vector2} end
 * @property {("horizontal"|"vertical")} orientation
 * @property {number} distance
 */

type Guide = {
  start: Vector2, 
  end: Vector2, 
  orientation: "horizontal" | "vertical",
  distance: number
}

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
  brushPosition: Vector2,
  grid: Grid,
  gridCellSize: Size,
  gridOffset: Vector2,
  gridCellOffset:  Vector2,
  snappingSensitivity: number,
  mapSize: Vector2
): Guide[] {
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
  brushPosition: Vector2,
  boundingBoxes: BoundingBox[],
  gridCellSize: Vector2, // TODO: check if this was meant to be of type Size
  snappingSensitivity: number
): Guide[] {
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
  let guides: Guide[] = [];
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
export function findBestGuides(brushPosition: Vector2, guides: Guide[]): Guide[] {
  let bestGuides: Guide[] = [];
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

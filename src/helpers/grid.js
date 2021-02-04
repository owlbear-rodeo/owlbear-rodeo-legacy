import GridSizeModel from "../ml/gridSize/GridSizeModel";
import Vector2 from "./Vector2";

import { logError } from "./logging";

const SQRT3 = 1.73205;

/**
 * @typedef GridInset
 * @property {Vector2} topLeft
 * @property {Vector2} bottomRight
 */

/**
 * @typedef Grid
 * @property {GridInset} inset
 * @property {Vector2} size
 * @property {("square"|"hexVertical"|"hexHorizontal")} type
 */

/**
 * @typedef CellSize
 * @property {number} width
 * @property {number} height
 * @property {number?} radius - Used for hex cell sizes
 */

/**
 * Gets the cell size for a grid taking into account inset and grid type
 * @param {Grid} grid
 * @param {number} insetWidth
 * @param {number} insetHeight
 * @returns {CellSize}
 */
export function getCellSize(grid, insetWidth, insetHeight) {
  if (grid.type === "square") {
    return {
      width: insetWidth / grid.size.x,
      height: insetHeight / grid.size.y,
    };
  } else if (grid.type === "hexVertical") {
    const radius = insetWidth / grid.size.x / SQRT3;
    return { width: radius * SQRT3, height: radius + radius / 2, radius };
  } else if (grid.type === "hexHorizontal") {
    const radius = insetHeight / grid.size.y / SQRT3;
    return { width: radius + radius / 2, height: radius * SQRT3, radius };
  }
}

/**
 * Find the location of cell in the grid
 * @param {Grid} grid
 * @param {number} x X-axis location of the cell
 * @param {number} y Y-axis location of the cell
 * @param {CellSize} cellSize
 * @returns {Vector2}
 */
export function getCellLocation(grid, x, y, cellSize) {
  if (grid.type === "square") {
    return { x: x * cellSize.width, y: y * cellSize.height };
  } else if (grid.type === "hexVertical") {
    return {
      x: x * cellSize.width + (cellSize.width * (1 + (y % 2))) / 2,
      y: y * cellSize.height + cellSize.radius,
    };
  } else if (grid.type === "hexHorizontal") {
    return {
      x: x * cellSize.width + cellSize.radius,
      y: y * cellSize.height + (cellSize.height * (1 + (x % 2))) / 2,
    };
  }
}

/**
 * Whether the cell located at `x, y` is out of bounds of the grid
 * @param {Grid} grid
 * @param {number} x X-axis location of the cell
 * @param {number} y Y-axis location of the cell
 * @returns {boolean}
 */
export function shouldClampCell(grid, x, y) {
  if (grid.type === "hexVertical") {
    return x === grid.size.x - 1 && y % 2 !== 0;
  } else if (grid.type === "hexHorizontal") {
    return y === grid.size.y - 1 && x % 2 !== 0;
  }
  return false;
}

/**
 * Get the default inset for a map
 * @param {number} width Hidth of the map
 * @param {number} height Height of the map
 * @param {number} gridX Number of grid cells in the horizontal direction
 * @param {number} gridY Number of grid cells in the vertical direction
 * @returns {GridInset}
 */
export function getMapDefaultInset(width, height, gridX, gridY) {
  // Max the width
  const gridScale = width / gridX;
  const y = gridY * gridScale;
  const yNorm = y / height;
  return { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: yNorm } };
}

/**
 * Get all factors of a number
 * @param {number} n
 * @returns {number[]}
 */
function factors(n) {
  const numbers = Array.from(Array(n + 1), (_, i) => i);
  return numbers.filter((i) => n % i === 0);
}

/**
 * Greatest common divisor
 * Uses the Euclidean algorithm https://en.wikipedia.org/wiki/Euclidean_algorithm
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function gcd(a, b) {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Find all dividers that fit into two numbers
 * @param {number} a
 * @param {number} b
 * @returns {number[]}
 */
function dividers(a, b) {
  const d = gcd(a, b);
  return factors(d);
}

// The mean and standard deviation of > 1500 maps from the web
const gridSizeMean = { x: 31.567792, y: 32.597987 };
const gridSizeStd = { x: 14.438842, y: 15.582376 };

// Most grid sizes are above 10 and below 200
const minGridSize = 10;
const maxGridSize = 200;

/**
 * Get whether the grid size is likely valid by checking whether it exceeds a bounds
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function gridSizeVaild(x, y) {
  return (
    x > minGridSize && y > minGridSize && x < maxGridSize && y < maxGridSize
  );
}

/**
 * Finds a grid size for an image by finding the closest size to the average grid size
 * @param {Image} image
 * @param {number[]} candidates
 * @returns {Vector2}
 */
function gridSizeHeuristic(image, candidates) {
  const width = image.width;
  const height = image.height;
  // Find the best candidate by comparing the absolute z-scores of each axis
  let bestX = 1;
  let bestY = 1;
  let bestScore = Number.MAX_VALUE;
  for (let scale of candidates) {
    const x = Math.floor(width / scale);
    const y = Math.floor(height / scale);
    const xScore = Math.abs((x - gridSizeMean.x) / gridSizeStd.x);
    const yScore = Math.abs((y - gridSizeMean.y) / gridSizeStd.y);
    if (xScore < bestScore || yScore < bestScore) {
      bestX = x;
      bestY = y;
      bestScore = Math.min(xScore, yScore);
    }
  }

  if (gridSizeVaild(bestX, bestY)) {
    return { x: bestX, y: bestY };
  } else {
    return null;
  }
}

/**
 * Finds the grid size of an image by running the image through a machine learning model
 * @param {Image} image
 * @param {number[]} candidates
 * @returns {Vector2}
 */
async function gridSizeML(image, candidates) {
  const width = image.width;
  const height = image.height;
  const ratio = width / height;
  let canvas = document.createElement("canvas");
  let context = canvas.getContext("2d");
  canvas.width = 2048;
  canvas.height = Math.floor(2048 / ratio);

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let imageData = context.getImageData(
    0,
    Math.floor(canvas.height / 2) - 16,
    2048,
    32
  );
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    // ITU-R 601-2 Luma Transform
    const luma = (r * 299) / 1000 + (g * 587) / 1000 + (b * 114) / 1000;

    imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = luma;
  }

  const model = new GridSizeModel();
  const prediction = await model.predict(imageData);

  // Find the candidate that is closest to the prediction
  let bestScale = 1;
  let bestScore = Number.MAX_VALUE;
  for (let scale of candidates) {
    const x = Math.floor(width / scale);
    const score = Math.abs(x - prediction);
    if (score < bestScore && x > minGridSize && x < maxGridSize) {
      bestScale = scale;
      bestScore = score;
    }
  }

  let x = Math.floor(width / bestScale);
  let y = Math.floor(height / bestScale);

  if (gridSizeVaild(x, y)) {
    return { x, y };
  } else {
    // Fallback to raw prediction
    x = Math.round(prediction);
    y = Math.floor(x / ratio);
  }

  if (gridSizeVaild(x, y)) {
    return { x, y };
  } else {
    return null;
  }
}

/**
 * Finds the grid size of an image by either using a ML model or falling back to a heuristic
 * @param {Image} image
 * @returns {Vector2}
 */
export async function getGridSize(image) {
  const candidates = dividers(image.width, image.height);
  let prediction;

  // Try and use ML grid detection
  try {
    prediction = await gridSizeML(image, candidates);
  } catch (error) {
    logError(error);
  }

  if (!prediction) {
    prediction = gridSizeHeuristic(image, candidates);
  }
  if (!prediction) {
    prediction = { x: 22, y: 22 };
  }

  return prediction;
}

/**
 * Get the max zoom for a grid
 * @param {Grid} grid
 * @returns {number}
 */
export function getGridMaxZoom(grid) {
  if (!grid) {
    return 10;
  }
  // Return max grid size / 2
  return Math.max(Math.max(grid.size.x, grid.size.y) / 2, 5);
}

/**
 * Snap a Konva Node to a the closest grid cell
 * @param {Grid} grid
 * @param {number} mapWidth
 * @param {number} mapHeight
 * @param {Konva.node} node
 * @param {number} snappingThreshold 1 = Always snap, 0 = never snap
 */
export function snapNodeToGrid(
  grid,
  mapWidth,
  mapHeight,
  node,
  snappingThreshold
) {
  const offset = Vector2.multiply(grid.inset.topLeft, {
    x: mapWidth,
    y: mapHeight,
  });
  const gridSize = {
    x:
      (mapWidth * (grid.inset.bottomRight.x - grid.inset.topLeft.x)) /
      grid.size.x,
    y:
      (mapHeight * (grid.inset.bottomRight.y - grid.inset.topLeft.y)) /
      grid.size.y,
  };

  const position = node.position();
  const halfSize = Vector2.divide({ x: node.width(), y: node.height() }, 2);

  // Offsets to tranform the centered position into the four corners
  const cornerOffsets = [
    { x: 0, y: 0 },
    halfSize,
    { x: -halfSize.x, y: -halfSize.y },
    { x: halfSize.x, y: -halfSize.y },
    { x: -halfSize.x, y: halfSize.y },
  ];

  // Minimum distance from a corner to the grid
  let minCornerGridDistance = Number.MAX_VALUE;
  // Minimum component of the difference between the min corner and the grid
  let minCornerMinComponent;
  // Closest grid value
  let minGridSnap;

  // Find the closest corner to the grid
  for (let cornerOffset of cornerOffsets) {
    const corner = Vector2.add(position, cornerOffset);
    // Transform into offset space, round, then transform back
    const gridSnap = Vector2.add(
      Vector2.roundTo(Vector2.subtract(corner, offset), gridSize),
      offset
    );
    const gridDistance = Vector2.length(Vector2.subtract(gridSnap, corner));
    const minComponent = Vector2.min(gridSize);
    if (gridDistance < minCornerGridDistance) {
      minCornerGridDistance = gridDistance;
      minCornerMinComponent = minComponent;
      // Move the grid value back to the center
      minGridSnap = Vector2.subtract(gridSnap, cornerOffset);
    }
  }

  // Snap to center of grid
  // Subtract offset and half grid size to transform it into offset half space then transform it back
  const halfGridSize = Vector2.multiply(gridSize, 0.5);
  const centerSnap = Vector2.add(
    Vector2.add(
      Vector2.roundTo(
        Vector2.subtract(Vector2.subtract(position, offset), halfGridSize),
        gridSize
      ),
      halfGridSize
    ),
    offset
  );
  const centerDistance = Vector2.length(Vector2.subtract(centerSnap, position));

  if (minCornerGridDistance < minCornerMinComponent * snappingThreshold) {
    node.position(minGridSnap);
  } else if (centerDistance < Vector2.min(gridSize) * snappingThreshold) {
    node.position(centerSnap);
  }
}

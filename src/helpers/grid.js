import GridSizeModel from "../ml/gridSize/GridSizeModel";
import Vector3 from "./Vector3";
import Vector2 from "./Vector2";
import Size from "./Size";

import { logError } from "./logging";

const SQRT3 = 1.73205;
const GRID_TYPE_NOT_IMPLEMENTED = new Error("Grid type not implemented");

/**
 * @typedef GridInset
 * @property {Vector2} topLeft Top left position of the inset
 * @property {Vector2} bottomRight Bottom right position of the inset
 */

/**
 * @typedef GridMeasurement
 * @property {("chebyshev"|"alternating"|"euclidean"|"manhattan")} type
 * @property {string} scale
 */

/**
 * @typedef Grid
 * @property {GridInset} inset The inset of the grid from the map
 * @property {Vector2} size The number of columns and rows of the grid as `x` and `y`
 * @property {("square"|"hexVertical"|"hexHorizontal")} type
 * @property {GridMeasurement} measurement
 */

/**
 * Gets the size of a grid in pixels taking into account the inset
 * @param {Grid} grid
 * @param {number} baseWidth Width of the grid in pixels before inset
 * @param {number} baseHeight Height of the grid in pixels before inset
 * @returns {Size}
 */
export function getGridPixelSize(grid, baseWidth, baseHeight) {
  const width = (grid.inset.bottomRight.x - grid.inset.topLeft.x) * baseWidth;
  const height = (grid.inset.bottomRight.y - grid.inset.topLeft.y) * baseHeight;
  return new Size(width, height);
}

/**
 * Gets the cell size for a grid in pixels for each grid type
 * @param {Grid} grid
 * @param {number} gridWidth Width of the grid in pixels after inset
 * @param {number} gridHeight Height of the grid in pixels after inset
 * @returns {Size}
 */
export function getCellPixelSize(grid, gridWidth, gridHeight) {
  if (grid.size.x === 0 || grid.size.y === 0) {
    return new Size(0, 0);
  }
  switch (grid.type) {
    case "square":
      return new Size(gridWidth / grid.size.x, gridHeight / grid.size.y);
    case "hexVertical":
      const radiusVert = gridWidth / grid.size.x / SQRT3;
      return new Size(radiusVert * SQRT3, radiusVert * 2, radiusVert);
    case "hexHorizontal":
      const radiusHorz = gridHeight / grid.size.y / SQRT3;
      return new Size(radiusHorz * 2, radiusHorz * SQRT3, radiusHorz);
    default:
      throw GRID_TYPE_NOT_IMPLEMENTED;
  }
}

/**
 * Find the center location of a cell in the grid.
 * Hex is addressed in an offset coordinate system with even numbered columns/rows offset to the right
 * @param {Grid} grid
 * @param {number} col X-axis coordinate of the cell
 * @param {number} row Y-axis coordinate of the cell
 * @param {Size} cellSize Cell size in pixels
 * @returns {Vector2}
 */
export function getCellLocation(grid, col, row, cellSize) {
  switch (grid.type) {
    case "square":
      return {
        x: col * cellSize.width + cellSize.width / 2,
        y: row * cellSize.height + cellSize.height / 2,
      };
    case "hexVertical":
      return {
        x: cellSize.radius * SQRT3 * (col - 0.5 * (row & 1)),
        y: ((cellSize.radius * 3) / 2) * row,
      };
    case "hexHorizontal":
      return {
        x: ((cellSize.radius * 3) / 2) * col,
        y: cellSize.radius * SQRT3 * (row - 0.5 * (col & 1)),
      };
    default:
      throw GRID_TYPE_NOT_IMPLEMENTED;
  }
}

/**
 * Find the coordinates of the nearest cell in the grid to a point in pixels
 * @param {Grid} grid
 * @param {number} x X location to look for in pixels
 * @param {number} y Y location to look for in pixels
 * @param {Size} cellSize Cell size in pixels
 * @returns {Vector2}
 */
export function getNearestCellCoordinates(grid, x, y, cellSize) {
  switch (grid.type) {
    case "square":
      return Vector2.divide(Vector2.floorTo({ x, y }, cellSize), cellSize);
    case "hexVertical":
      // Find nearest cell in cube coordinates the convert to offset coordinates
      const cubeXVert = ((SQRT3 / 3) * x - (1 / 3) * y) / cellSize.radius;
      const cubeZVert = ((2 / 3) * y) / cellSize.radius;
      const cubeYVert = -cubeXVert - cubeZVert;
      const cubeVert = new Vector3(cubeXVert, cubeYVert, cubeZVert);
      return hexCubeToOffset(Vector3.cubeRound(cubeVert), "hexVertical");
    case "hexHorizontal":
      const cubeXHorz = ((2 / 3) * x) / cellSize.radius;
      const cubeZHorz = (-(1 / 3) * x + (SQRT3 / 3) * y) / cellSize.radius;
      const cubeYHorz = -cubeXHorz - cubeZHorz;
      const cubeHorz = new Vector3(cubeXHorz, cubeYHorz, cubeZHorz);
      return hexCubeToOffset(Vector3.cubeRound(cubeHorz), "hexHorizontal");
    default:
      throw GRID_TYPE_NOT_IMPLEMENTED;
  }
}

/**
 * Find the corners of a grid cell
 * @param {Grid} grid
 * @param {number} x X location of the cell in pixels
 * @param {number} y Y location of the cell in pixels
 * @param {Size} cellSize Cell size in pixels
 * @returns {Vector2[]}
 */
export function getCellCorners(grid, x, y, cellSize) {
  const position = new Vector2(x, y);
  switch (grid.type) {
    case "square":
      const halfSize = Vector2.multiply(cellSize, 0.5);
      return [
        Vector2.add(position, Vector2.multiply(halfSize, { x: -1, y: -1 })),
        Vector2.add(position, Vector2.multiply(halfSize, { x: 1, y: -1 })),
        Vector2.add(position, Vector2.multiply(halfSize, { x: 1, y: 1 })),
        Vector2.add(position, Vector2.multiply(halfSize, { x: -1, y: 1 })),
      ];
    case "hexVertical":
      const up = Vector2.subtract(position, { x: 0, y: cellSize.radius });
      return [
        up,
        Vector2.rotate(up, position, 60),
        Vector2.rotate(up, position, 120),
        Vector2.rotate(up, position, 180),
        Vector2.rotate(up, position, 240),
        Vector2.rotate(up, position, 300),
      ];
    case "hexHorizontal":
      const right = Vector2.add(position, { x: cellSize.radius, y: 0 });
      return [
        right,
        Vector2.rotate(right, position, 60),
        Vector2.rotate(right, position, 120),
        Vector2.rotate(right, position, 180),
        Vector2.rotate(right, position, 240),
        Vector2.rotate(right, position, 300),
      ];
    default:
      throw GRID_TYPE_NOT_IMPLEMENTED;
  }
}

/**
 * Get the height of a grid based off of its width
 * @param {Grid} grid
 * @param {number} gridWidth Width of the grid in pixels after inset
 */
function getGridHeightFromWidth(grid, gridWidth) {
  switch (grid.type) {
    case "square":
      return (grid.size.y * gridWidth) / grid.size.x;
    case "hexVertical":
      const cellHeightVert = (gridWidth / grid.size.x / SQRT3) * 2;
      return grid.size.y * cellHeightVert * (3 / 4) + cellHeightVert * (1 / 4);
    case "hexHorizontal":
      const cellHeightHroz = gridWidth / ((grid.size.x - 1) * (3 / 4) + 1);
      return grid.size.y * cellHeightHroz * (SQRT3 / 2);
    default:
      throw GRID_TYPE_NOT_IMPLEMENTED;
  }
}

/**
 * Get the default inset for a grid
 * @param {Grid} grid Grid with no inset property set
 * @param {number} mapWidth Width of the map in pixels before inset
 * @param {number} mapHeight Height of the map in pixels before inset
 * @returns {GridInset}
 */
export function getGridDefaultInset(grid, mapWidth, mapHeight) {
  // Max the width of the inset and figure out the resulting height value
  const insetHeightNorm = getGridHeightFromWidth(grid, mapWidth) / mapHeight;
  return { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: insetHeightNorm } };
}

/**
 * Get an updated inset for a grid when its size changes
 * @param {Grid} grid Grid with an inset property set
 * @param {number} mapWidth Width of the map in pixels before inset
 * @param {number} mapHeight Height of the map in pixels before inset
 * @returns {GridInset}
 */
export function getGridUpdatedInset(grid, mapWidth, mapHeight) {
  let inset = {
    topLeft: { ...grid.inset.topLeft },
    bottomRight: { ...grid.inset.bottomRight },
  };
  // Take current inset width and use it to calculate the new height
  if (grid.size.x > 0 && grid.size.x > 0) {
    // Convert to px relative to map size
    const gridWidth = (inset.bottomRight.x - inset.topLeft.x) * mapWidth;
    // Calculate the new inset height and convert back to normalized form
    const insetHeightNorm = getGridHeightFromWidth(grid, gridWidth) / mapHeight;
    inset.bottomRight.y = inset.topLeft.y + insetHeightNorm;
  }
  return inset;
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
 * Convert from a 3D cube hex representation to a 2D offset one
 * @param {Vector3} cube Cube representation of the hex cell
 * @param {("hexVertical"|"hexHorizontal")} type
 * @returns {Vector2}
 */
export function hexCubeToOffset(cube, type) {
  if (type === "hexVertical") {
    const x = cube.x + (cube.z + (cube.z & 1)) / 2;
    const y = cube.z;
    return new Vector2(x, y);
  } else {
    const x = cube.x;
    const y = cube.z + (cube.x + (cube.x & 1)) / 2;
    return new Vector2(x, y);
  }
}
/**
 * Convert from a 2D offset hex representation to a 3D cube one
 * @param {Vector2} offset Offset representation of the hex cell
 * @param {("hexVertical"|"hexHorizontal")} type
 * @returns {Vector3}
 */
export function hexOffsetToCube(offset, type) {
  if (type === "hexVertical") {
    const x = offset.x - (offset.y + (offset.y & 1)) / 2;
    const z = offset.y;
    const y = -x - z;
    return { x, y, z };
  } else {
    const x = offset.x;
    const z = offset.y - (offset.x + (offset.x & 1)) / 2;
    const y = -x - z;
    return { x, y, z };
  }
}

/**
 * Get the distance between a and b on the grid
 * @param {Grid} grid
 * @param {Vector2} a
 * @param {Vector2} b
 */
export function gridDistance(grid, a, b, cellSize) {
  // Get grid coordinates
  const aCoord = getNearestCellCoordinates(grid, a.x, a.y, cellSize);
  const bCoord = getNearestCellCoordinates(grid, b.x, b.y, cellSize);
  if (grid.type === "square") {
    if (grid.measurement.type === "chebyshev") {
      return Vector2.max(Vector2.abs(Vector2.subtract(aCoord, bCoord)));
    } else if (grid.measurement.type === "alternating") {
      // Alternating diagonal distance like D&D 3.5 and Pathfinder
      const delta = Vector2.abs(Vector2.subtract(aCoord, bCoord));
      const max = Vector2.max(delta);
      const min = Vector2.min(delta);
      return max - min + Math.floor(1.5 * min);
    } else if (grid.measurement.type === "euclidean") {
      return Vector2.length(Vector2.divide(Vector2.subtract(a, b), cellSize));
    } else if (grid.measurement.type === "manhattan") {
      return Math.abs(aCoord.x - bCoord.x) + Math.abs(aCoord.y - bCoord.y);
    }
  } else {
    if (grid.measurement.type === "manhattan") {
      // Convert to cube coordinates to get distance easier
      const aCube = hexOffsetToCube(aCoord, grid.type);
      const bCube = hexOffsetToCube(bCoord, grid.type);
      return (
        (Math.abs(aCube.x - bCube.x) +
          Math.abs(aCube.y - bCube.y) +
          Math.abs(aCube.z - bCube.z)) /
        2
      );
    } else if (grid.measurement.type === "euclidean") {
      return Vector2.length(Vector2.divide(Vector2.subtract(a, b), cellSize));
    }
  }
}

/**
 * @typedef GridScale
 * @property {number} multiplier The number multiplier of the scale
 * @property {string} unit The unit of the scale
 * @property {number} digits The precision of the scale
 */

/**
 * Parse a string representation of scale e.g. 5ft into a `GridScale`
 * @param {string} scale
 * @returns {GridScale}
 */

export function parseGridScale(scale) {
  if (typeof scale === "string") {
    const match = scale.match(/(\d*)(\.\d*)?([a-zA-Z]*)/);
    const integer = parseFloat(match[1]);
    const fractional = parseFloat(match[2]);
    const unit = match[3] || "";
    if (!isNaN(integer) && !isNaN(fractional)) {
      return {
        multiplier: integer + fractional,
        unit: unit,
        digits: match[2].length - 1,
      };
    } else if (!isNaN(integer) && isNaN(fractional)) {
      return { multiplier: integer, unit: unit, digits: 0 };
    }
  }
  return { multiplier: 1, unit: "", digits: 0 };
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
export async function getGridSizeFromImage(image) {
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

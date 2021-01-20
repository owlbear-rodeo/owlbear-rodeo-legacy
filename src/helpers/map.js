import GridSizeModel from "../ml/gridSize/GridSizeModel";
import * as Vector2 from "./vector2";

import { logError } from "./logging";

export function getMapDefaultInset(width, height, gridX, gridY) {
  // Max the width
  const gridScale = width / gridX;
  const y = gridY * gridScale;
  const yNorm = y / height;
  return { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: yNorm } };
}

// Get all factors of a number
function factors(n) {
  const numbers = Array.from(Array(n + 1), (_, i) => i);
  return numbers.filter((i) => n % i === 0);
}

// Greatest common divisor
// Euclidean algorithm https://en.wikipedia.org/wiki/Euclidean_algorithm
function gcd(a, b) {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// Find all dividers that fit into two numbers
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

export function gridSizeVaild(x, y) {
  return (
    x > minGridSize && y > minGridSize && x < maxGridSize && y < maxGridSize
  );
}

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

export function getMapMaxZoom(map) {
  if (!map) {
    return 10;
  }
  // Return max grid size / 2
  return Math.max(Math.max(map.grid.size.x, map.grid.size.y) / 2, 5);
}

export function snapNodeToMap(
  map,
  mapWidth,
  mapHeight,
  node,
  snappingThreshold
) {
  const offset = Vector2.multiply(map.grid.inset.topLeft, {
    x: mapWidth,
    y: mapHeight,
  });
  const gridSize = {
    x:
      (mapWidth * (map.grid.inset.bottomRight.x - map.grid.inset.topLeft.x)) /
      map.grid.size.x,
    y:
      (mapHeight * (map.grid.inset.bottomRight.y - map.grid.inset.topLeft.y)) /
      map.grid.size.y,
  };

  const position = node.position();
  const halfSize = Vector2.divide({ x: node.width(), y: node.height() }, 2);

  // Offsets to tranform the centered position into the four corners
  const cornerOffsets = [
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

  if (minCornerGridDistance < minCornerMinComponent * snappingThreshold) {
    node.position(minGridSnap);
  }
}

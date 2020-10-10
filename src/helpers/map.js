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

// Most grid sizes are above 10 and below 100
function gridSizeVaild(x, y) {
  return x > 10 && y > 10 && x < 100 && y < 100;
}

export function gridSizeHeuristic(width, height) {
  const div = dividers(width, height);
  if (div.length > 0) {
    // Find the best division by comparing the absolute z-scores of each axis
    let bestX = 1;
    let bestY = 1;
    let bestScore = Number.MAX_VALUE;
    for (let scale of div) {
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
    }
  }
  return { x: 22, y: 22 };
}

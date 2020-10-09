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

const commonGridScales = [35, 70, 72, 111, 140, 144, 300];

// Most grid scales are above 10 and below 100
function gridScaleVaild(x, y) {
  return x > 10 && y > 10 && x < 100 && y < 100;
}

export function gridSizeHeuristic(width, height) {
  const div = dividers(width, height);
  if (div.length > 0) {
    let x = 1;
    let y = 1;
    // Check common scales but make sure the grid size is above 10 and below 100
    for (let scale of commonGridScales) {
      const tempX = Math.floor(width / scale);
      const tempY = Math.floor(height / scale);
      if (div.includes(scale) && gridScaleVaild(tempX, tempY)) {
        x = tempX;
        y = tempY;
      }
    }

    if (gridScaleVaild(x, y)) {
      return { x, y };
    }
  }
  return { x: 22, y: 22 };
}

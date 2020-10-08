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

const commonGridScales = [70, 111, 140, 300];

export function gridSizeHeuristic(width, height) {
  const div = dividers(width, height);
  if (div.length > 0) {
    // default to middle divider
    let scale = div[Math.floor(div.length / 2)];
    for (let common of commonGridScales) {
      // Check common but make sure the grid size is above 10
      if (div.includes(common) && width / common > 10 && height / common > 10) {
        scale = common;
      }
    }
    const x = Math.floor(width / scale);
    const y = Math.floor(height / scale);
    // Check grid size is below 100
    if (x < 100 && y < 100) {
      return { x, y };
    }
  }
  return { x: 22, y: 22 };
}

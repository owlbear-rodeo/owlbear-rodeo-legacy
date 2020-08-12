import {
  toRadians,
  roundTo as roundToNumber,
  lerp as lerpNumber,
} from "./shared";

export function lengthSquared(p) {
  return p.x * p.x + p.y * p.y;
}

export function length(p) {
  return Math.sqrt(lengthSquared(p));
}

export function normalize(p) {
  const l = length(p);
  if (l === 0) {
    return { x: 0, y: 0 };
  }
  return divide(p, l);
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function subtract(a, b) {
  if (typeof b === "number") {
    return { x: a.x - b, y: a.y - b };
  } else {
    return { x: a.x - b.x, y: a.y - b.y };
  }
}

export function add(a, b) {
  if (typeof b === "number") {
    return { x: a.x + b, y: a.y + b };
  } else {
    return { x: a.x + b.x, y: a.y + b.y };
  }
}

export function multiply(a, b) {
  if (typeof b === "number") {
    return { x: a.x * b, y: a.y * b };
  } else {
    return { x: a.x * b.x, y: a.y * b.y };
  }
}

export function divide(a, b) {
  if (typeof b === "number") {
    return { x: a.x / b, y: a.y / b };
  } else {
    return { x: a.x / b.x, y: a.y / b.y };
  }
}

export function rotate(point, origin, angle) {
  const cos = Math.cos(toRadians(angle));
  const sin = Math.sin(toRadians(angle));
  const dif = subtract(point, origin);
  return {
    x: origin.x + cos * dif.x - sin * dif.y,
    y: origin.y + sin * dif.x + cos * dif.y,
  };
}

export function rotateDirection(direction, angle) {
  return rotate(direction, { x: 0, y: 0 }, angle);
}

export function min(a) {
  return a.x < a.y ? a.x : a.y;
}

export function max(a) {
  return a.x > a.y ? a.x : a.y;
}

export function roundTo(p, to) {
  return {
    x: roundToNumber(p.x, to.x),
    y: roundToNumber(p.y, to.y),
  };
}

export function sign(a) {
  return { x: Math.sign(a.x), y: Math.sign(a.y) };
}

export function abs(a) {
  return { x: Math.abs(a.x), y: Math.abs(a.y) };
}

export function pow(a, b) {
  if (typeof b === "number") {
    return { x: Math.pow(a.x, b), y: Math.pow(a.y, b) };
  } else {
    return { x: Math.pow(a.x, b.x), y: Math.pow(a.y, b.y) };
  }
}

export function dot2(a) {
  return dot(a, a);
}

export function clamp(a, min, max) {
  return {
    x: Math.min(Math.max(a.x, min), max),
    y: Math.min(Math.max(a.y, min), max),
  };
}

// https://iquilezles.org/www/articles/distfunctions2d/distfunctions2d
export function distanceToLine(p, a, b) {
  const pa = subtract(p, a);
  const ba = subtract(b, a);
  const h = Math.min(Math.max(dot(pa, ba) / dot(ba, ba), 0), 1);
  const distance = length(subtract(pa, multiply(ba, h)));
  const point = add(a, multiply(ba, h));
  return { distance, point };
}

// TODO: Fix the robustness of this to allow smoothing on fog layers
// https://www.shadertoy.com/view/MlKcDD
export function distanceToQuadraticBezier(pos, A, B, C) {
  let distance = 0;
  let point = { x: pos.x, y: pos.y };

  const a = subtract(B, A);
  const b = add(subtract(A, multiply(B, 2)), C);
  const c = multiply(a, 2);
  const d = subtract(A, pos);

  // Solve cubic roots to find closest points
  const kk = 1 / dot(b, b);
  const kx = kk * dot(a, b);
  const ky = (kk * (2 * dot(a, a) + dot(d, b))) / 3;
  const kz = kk * dot(d, a);

  const p = ky - kx * kx;
  const p3 = p * p * p;
  const q = kx * (2 * kx * kx - 3 * ky) + kz;
  let h = q * q + 4 * p3;

  if (h >= 0) {
    // 1 root
    h = Math.sqrt(h);
    const x = divide(subtract({ x: h, y: -h }, q), 2);
    const uv = multiply(sign(x), pow(abs(x), 1 / 3));
    const t = Math.min(Math.max(uv.x + uv.y - kx, 0), 1);
    point = add(A, multiply(add(c, multiply(b, t)), t));
    distance = dot2(add(d, multiply(add(c, multiply(b, t)), t)));
  } else {
    // 3 roots but ignore the 3rd one as it will never be closest
    // https://www.shadertoy.com/view/MdXBzB
    const z = Math.sqrt(-p);
    const v = Math.acos(q / (p * z * 2)) / 3;
    const m = Math.cos(v);
    const n = Math.sin(v) * 1.732050808;

    const t = clamp(subtract(multiply({ x: m + m, y: -n - m }, z), kx), 0, 1);
    const d1 = dot2(add(d, multiply(add(c, multiply(b, t.x)), t.x)));
    const d2 = dot2(add(d, multiply(add(c, multiply(b, t.y)), t.y)));
    distance = Math.min(d1, d2);
    if (d1 < d2) {
      point = add(d, multiply(add(c, multiply(b, t.x)), t.x));
    } else {
      point = add(d, multiply(add(c, multiply(b, t.y)), t.y));
    }
  }

  return { distance: Math.sqrt(distance), point: point };
}

export function getBounds(points) {
  let minX = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let minY = Number.MAX_VALUE;
  let maxY = Number.MIN_VALUE;
  for (let point of points) {
    minX = point.x < minX ? point.x : minX;
    maxX = point.x > maxX ? point.x : maxX;
    minY = point.y < minY ? point.y : minY;
    maxY = point.y > maxY ? point.y : maxY;
  }
  return { minX, maxX, minY, maxY };
}

// Check bounds then use ray casting algorithm
// https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm
// https://stackoverflow.com/questions/217578/how-can-i-determine-whether-a-2d-point-is-within-a-polygon/2922778
export function pointInPolygon(p, points) {
  const { minX, maxX, minY, maxY } = getBounds(points);
  if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
    return false;
  }

  let isInside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i].y > p.y;
    const b = points[j].y > p.y;
    if (
      a !== b &&
      p.x <
        ((points[j].x - points[i].x) * (p.y - points[i].y)) /
          (points[j].y - points[i].y) +
          points[i].x
    ) {
      isInside = !isInside;
    }
  }
  return isInside;
}

/**
 * Returns true if a the distance between a and b is under threshold
 * @param {Vector2} a
 * @param {Vector2} b
 * @param {number} threshold
 */
export function compare(a, b, threshold) {
  return lengthSquared(subtract(a, b)) < threshold * threshold;
}

/**
 * Returns the distance between two vectors
 * @param {Vector2} a
 * @param {Vector2} b
 * @param {string} type - "chebyshev" | "euclidean" | "manhattan"
 */
export function distance(a, b, type) {
  switch (type) {
    case "chebyshev":
      return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    case "euclidean":
      return length(subtract(a, b));
    case "manhattan":
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    default:
      return length(subtract(a, b));
  }
}

export function lerp(a, b, alpha) {
  return { x: lerpNumber(a.x, b.x, alpha), y: lerpNumber(a.y, b.y, alpha) };
}

/**
 * Returns total length of a an array of points treated as a path
 * @param {Array} points the array of points in the path
 */
export function pathLength(points) {
  let l = 0;
  for (let i = 1; i < points.length; i++) {
    l += distance(points[i - 1], points[i], "euclidean");
  }
  return l;
}

/**
 * Resample a path to n number of evenly distributed points
 * based off of http://depts.washington.edu/acelab/proj/dollar/index.html
 * @param {Array} points the points to resample
 * @param {number} n the number of new points
 */
export function resample(points, n) {
  if (points.length === 0 || n <= 0) {
    return [];
  }
  let localPoints = [...points];
  const intervalLength = pathLength(localPoints) / (n - 1);
  let resampledPoints = [localPoints[0]];
  let currentDistance = 0;
  for (let i = 1; i < localPoints.length; i++) {
    let d = distance(localPoints[i - 1], localPoints[i], "euclidean");
    if (currentDistance + d >= intervalLength) {
      let newPoint = lerp(
        localPoints[i - 1],
        localPoints[i],
        (intervalLength - currentDistance) / d
      );
      resampledPoints.push(newPoint);
      localPoints.splice(i, 0, newPoint);
      currentDistance = 0;
    } else {
      currentDistance += d;
    }
  }
  if (resampledPoints.length === n - 1) {
    resampledPoints.push(localPoints[localPoints.length - 1]);
  }

  return resampledPoints;
}

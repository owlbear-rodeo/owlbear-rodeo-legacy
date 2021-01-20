import {
  toRadians,
  roundTo as roundToNumber,
  lerp as lerpNumber,
} from "./shared";

/**
 * Vector class with x and y
 * @typedef {Object} Vector2
 * @property {number} x - X component of the vector
 * @property {number} y - Y component of the vector
 */

/**
 * @param {Vector2} p
 * @returns {number} Length squared of `p`
 */
export function lengthSquared(p) {
  return p.x * p.x + p.y * p.y;
}

/**
 * @param {Vector2} p
 * @returns {number} Length of `p`
 */
export function length(p) {
  return Math.sqrt(lengthSquared(p));
}

/**
 * @param {Vector2} p
 * @returns {Vector2} `p` normalized, if length of `p` is 0 `{x: 0, y: 0}` is returned
 */
export function normalize(p) {
  const l = length(p);
  if (l === 0) {
    return { x: 0, y: 0 };
  }
  return divide(p, l);
}

/**
 * @param {Vector2} a
 * @param {Vector2} b
 * @returns {number}  Dot product between `a` and `b`
 */
export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

/**
 * @param {Vector2} a
 * @param {(Vector2 | number)} b
 * @returns {Vector2} a - b
 */
export function subtract(a, b) {
  if (typeof b === "number") {
    return { x: a.x - b, y: a.y - b };
  } else {
    return { x: a.x - b.x, y: a.y - b.y };
  }
}

/**
 * @param {Vector2} a
 * @param {(Vector2 | number)} b
 * @returns {Vector2} a + b
 */
export function add(a, b) {
  if (typeof b === "number") {
    return { x: a.x + b, y: a.y + b };
  } else {
    return { x: a.x + b.x, y: a.y + b.y };
  }
}

/**
 * @param {Vector2} a
 * @param {(Vector2 | number)} b
 * @returns {Vector2} a * b
 */
export function multiply(a, b) {
  if (typeof b === "number") {
    return { x: a.x * b, y: a.y * b };
  } else {
    return { x: a.x * b.x, y: a.y * b.y };
  }
}

/**
 * @param {Vector2} a
 * @param {(Vector2 | number)} b
 * @returns {Vector2} a / b
 */
export function divide(a, b) {
  if (typeof b === "number") {
    return { x: a.x / b, y: a.y / b };
  } else {
    return { x: a.x / b.x, y: a.y / b.y };
  }
}

/**
 * Rotates a point around a given origin by an angle in degrees
 * @param {Vector2} point Point to rotate
 * @param {Vector2} origin Origin of the rotation
 * @param {number} angle Angle of rotation in degrees
 * @returns {Vector2} Rotated point
 */
export function rotate(point, origin, angle) {
  const cos = Math.cos(toRadians(angle));
  const sin = Math.sin(toRadians(angle));
  const dif = subtract(point, origin);
  return {
    x: origin.x + cos * dif.x - sin * dif.y,
    y: origin.y + sin * dif.x + cos * dif.y,
  };
}

/**
 * Rotates a direction by a given angle in degrees
 * @param {Vector2} direction Direction to rotate
 * @param {number} angle Angle of rotation in degrees
 * @returns {Vector2} Rotated direction
 */
export function rotateDirection(direction, angle) {
  return rotate(direction, { x: 0, y: 0 }, angle);
}

/**
 * Returns the min of `value` and `minimum`, if `minimum` is undefined component wise min is returned instead
 * @param {Vector2} a
 * @param {(Vector2 | number)} [minimum] Value to compare
 * @returns {(Vector2 | number)}
 */
export function min(a, minimum) {
  if (minimum === undefined) {
    return a.x < a.y ? a.x : a.y;
  } else if (typeof minimum === "number") {
    return { x: Math.min(a.x, minimum), y: Math.min(a.y, minimum) };
  } else {
    return { x: Math.min(a.x, minimum.x), y: Math.min(a.y, minimum.y) };
  }
}
/**
 * Returns the max of `a` and `maximum`, if `maximum` is undefined component wise max is returned instead
 * @param {Vector2} a
 * @param {(Vector2 | number)} [maximum] Value to compare
 * @returns {(Vector2 | number)}
 */
export function max(a, maximum) {
  if (maximum === undefined) {
    return a.x > a.y ? a.x : a.y;
  } else if (typeof maximum === "number") {
    return { x: Math.max(a.x, maximum), y: Math.max(a.y, maximum) };
  } else {
    return { x: Math.max(a.x, maximum.x), y: Math.max(a.y, maximum.y) };
  }
}

/**
 * Rounds `p` to the nearest value of `to`
 * @param {Vector2} p
 * @param {Vector2} to
 * @returns {Vector2}
 */
export function roundTo(p, to) {
  return {
    x: roundToNumber(p.x, to.x),
    y: roundToNumber(p.y, to.y),
  };
}

/**
 * @param {Vector2} a
 * @returns {Vector2} The component wise sign of `a`
 */
export function sign(a) {
  return { x: Math.sign(a.x), y: Math.sign(a.y) };
}

/**
 * @param {Vector2} a
 * @returns {Vector2} The component wise absolute of `a`
 */
export function abs(a) {
  return { x: Math.abs(a.x), y: Math.abs(a.y) };
}

/**
 * @param {Vector2} a
 * @param {(Vector2 | number)} b
 * @returns {Vector2} `a` to the power of `b`
 */
export function pow(a, b) {
  if (typeof b === "number") {
    return { x: Math.pow(a.x, b), y: Math.pow(a.y, b) };
  } else {
    return { x: Math.pow(a.x, b.x), y: Math.pow(a.y, b.y) };
  }
}

/**
 * @param {Vector2} a
 * @returns {number} The dot product between `a` and `a`
 */
export function dot2(a) {
  return dot(a, a);
}

/**
 * Clamps `a` between `min` and `max`
 * @param {Vector2} a
 * @param {number} min
 * @param {number} max
 * @returns {Vector2}
 */
export function clamp(a, min, max) {
  return {
    x: Math.min(Math.max(a.x, min), max),
    y: Math.min(Math.max(a.y, min), max),
  };
}

/**
 * Calculates the distance between a point and a line segment
 * See more at {@link https://www.iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm}
 * @param {Vector2} p Point
 * @param {Vector2} a Start of the line
 * @param {Vector2} b End of the line
 * @returns {Object} The distance to and the closest point on the line segment
 */
export function distanceToLine(p, a, b) {
  const pa = subtract(p, a);
  const ba = subtract(b, a);
  const h = Math.min(Math.max(dot(pa, ba) / dot(ba, ba), 0), 1);
  const distance = length(subtract(pa, multiply(ba, h)));
  const point = add(a, multiply(ba, h));
  return { distance, point };
}

/**
 * Calculates the distance between a point and a quadratic bezier curve
 * See more at {@link https://www.shadertoy.com/view/MlKcDD}
 * @todo Fix the robustness of this to allow smoothing on fog layers
 * @param {Vector2} pos Position
 * @param {Vector2} A Start of the curve
 * @param {Vector2} B Control point of the curve
 * @param {Vector2} C End of the curve
 * @returns {Object} The distance to and the closest point on the curve
 */
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

/**
 * Calculates an axis-aligned bounding box around an array of point
 * @param {Vector2[]} points
 * @returns {Object}
 */
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

/**
 * Checks to see if a point is in a polygon using ray casting
 * See more at {@link https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm}
 * and {@link https://stackoverflow.com/questions/217578/how-can-i-determine-whether-a-2d-point-is-within-a-polygon/2922778}
 * @param {Vector2} p
 * @param {Vector2[]} points
 * @returns {boolean}
 */
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
 * Returns true if a the distance between `a` and `b` is under `threshold`
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
 * @param {string} type - `chebyshev | euclidean | manhattan | alternating`
 */
export function distance(a, b, type) {
  switch (type) {
    case "chebyshev":
      return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    case "euclidean":
      return length(subtract(a, b));
    case "manhattan":
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    case "alternating":
      // Alternating diagonal distance like D&D 3.5 and Pathfinder
      const delta = abs(subtract(a, b));
      const ma = max(delta);
      const mi = min(delta);
      return ma - mi + Math.floor(1.5 * mi);
    default:
      return length(subtract(a, b));
  }
}

/**
 * Linear interpolate between `a` and `b` by `alpha`
 * @param {Vector2} a
 * @param {Vector2} b
 * @param {number} alpha
 * @returns {Vector2}
 */
export function lerp(a, b, alpha) {
  return { x: lerpNumber(a.x, b.x, alpha), y: lerpNumber(a.y, b.y, alpha) };
}

/**
 * Returns total length of a an array of points treated as a path
 * @param {Vector2[]} points the array of points in the path
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
 * @param {Vector2[]} points the points to resample
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

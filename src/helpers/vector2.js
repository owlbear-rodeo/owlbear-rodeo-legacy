import { toRadians, roundTo as roundToNumber } from "./shared";

export function lengthSquared(p) {
  return p.x * p.x + p.y * p.y;
}

export function length(p) {
  return Math.sqrt(lengthSquared(p));
}

export function normalize(p) {
  const l = length(p);
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

// https://iquilezles.org/www/articles/distfunctions2d/distfunctions2d
export function distanceToLine(p, a, b) {
  const pa = subtract(p, a);
  const ba = subtract(b, a);
  const h = Math.min(Math.max(dot(pa, ba) / dot(ba, ba), 0), 1);
  return length(subtract(pa, multiply(ba, h)));
}

export function closestPointOnLine(p, a, b) {
  const pa = subtract(p, a);
  const ba = subtract(b, a);
  const h = dot(pa, ba) / lengthSquared(ba);
  return add(a, multiply(ba, h));
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

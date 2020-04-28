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

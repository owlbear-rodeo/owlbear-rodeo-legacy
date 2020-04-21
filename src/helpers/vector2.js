export function lengthSquared(p) {
  return p.x * p.x + p.y * p.y;
}

export function length(p) {
  return Math.sqrt(lengthSquared(p));
}

export function normalize(p) {
  const l = length(p);
  return { x: p.x / l, y: p.y / l };
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

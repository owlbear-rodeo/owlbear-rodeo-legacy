import {
  toRadians,
  roundTo as roundToNumber,
  lerp as lerpNumber,
  floorTo as floorToNumber,
} from "./shared";

export type BoundingBox = {
  min: Vector2, 
  max: Vector2, 
  width: number, 
  height: number, 
  center: Vector2
}

/**
 * Vector class with x, y and static helper methods
 */
class Vector2 {
  /**
   * @type {number} x - X component of the vector
   */
  x: number;
  /**
   * @type {number} y - Y component of the vector
   */
  y: number;

  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Vector2} p
   * @returns {number} Length squared of `p`
   */
  static lengthSquared(p: Vector2): number {
    return p.x * p.x + p.y * p.y;
  }

  /**
   * @param {Vector2} p
   * @returns {number} Length of `p`
   */
  static setLength(p: Vector2): number {
    return Math.sqrt(this.lengthSquared(p));
  }

  /**
   * @param {Vector2} p
   * @returns {Vector2} `p` normalized, if length of `p` is 0 `{x: 0, y: 0}` is returned
   */
  static normalize(p: Vector2): Vector2 {
    const l = this.setLength(p);
    if (l === 0) {
      return { x: 0, y: 0 };
    }
    return this.divide(p, l);
  }

  /**
   * @param {Vector2} a
   * @param {Vector2} b
   * @returns {number}  Dot product between `a` and `b`
   */
  static dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  }

  /**
   * @param {Vector2} a
   * @param {(Vector2 | number)} b
   * @returns {Vector2} a - b
   */
  static subtract(a: Vector2, b: Vector2 | number): Vector2 {
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
  static add(a: Vector2, b: Vector2 | number): Vector2 {
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
  static multiply(a: Vector2, b: Vector2 | number): Vector2 {
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
  static divide(a: Vector2, b: Vector2 | number): Vector2 {
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
  static rotate(point: Vector2, origin: Vector2, angle: number): Vector2 {
    const cos = Math.cos(toRadians(angle));
    const sin = Math.sin(toRadians(angle));
    const dif = this.subtract(point, origin);
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
  static rotateDirection(direction: Vector2, angle: number): Vector2 {
    return this.rotate(direction, { x: 0, y: 0 }, angle);
  }

  /**
   * Returns the min of `value` and `minimum`, if `minimum` is undefined component wise min is returned instead
   * @param {Vector2} a
   * @param {(Vector2 | number)} [minimum] Value to compare
   * @returns {(Vector2 | number)}
   */
  static min(a: Vector2, minimum?: Vector2 | number): Vector2 | number {
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
  static max(a: Vector2, maximum?: Vector2 | number): Vector2 | number {
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
  static roundTo(p: Vector2, to: Vector2): Vector2 {
    return {
      x: roundToNumber(p.x, to.x),
      y: roundToNumber(p.y, to.y),
    };
  }

  /**
   * Floors `p` to the nearest value of `to`
   * @param {Vector2} p
   * @param {Vector2} to
   * @returns {Vector2}
   */
  static floorTo(p: Vector2, to: Vector2): Vector2 {
    return {
      x: floorToNumber(p.x, to.x),
      y: floorToNumber(p.y, to.y),
    };
  }

  /**
   * @param {Vector2} a
   * @returns {Vector2} The component wise sign of `a`
   */
  static sign(a: Vector2): Vector2 {
    return { x: Math.sign(a.x), y: Math.sign(a.y) };
  }

  /**
   * @param {Vector2} a
   * @returns {Vector2} The component wise absolute of `a`
   */
  static abs(a: Vector2): Vector2 {
    return { x: Math.abs(a.x), y: Math.abs(a.y) };
  }

  /**
   * @param {Vector2} a
   * @param {(Vector2 | number)} b
   * @returns {Vector2} `a` to the power of `b`
   */
  static pow(a: Vector2, b: Vector2 | number): Vector2 {
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
  static dot2(a: Vector2): number {
    return this.dot(a, a);
  }

  /**
   * Clamps `a` between `min` and `max`
   * @param {Vector2} a
   * @param {number} min
   * @param {number} max
   * @returns {Vector2}
   */
  static clamp(a: Vector2, min: number, max: number): Vector2 {
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
  static distanceToLine(p: Vector2, a: Vector2, b: Vector2): Object {
    const pa = this.subtract(p, a);
    const ba = this.subtract(b, a);
    const h = Math.min(Math.max(this.dot(pa, ba) / this.dot(ba, ba), 0), 1);
    const distance = this.setLength(this.subtract(pa, this.multiply(ba, h)));
    const point = this.add(a, this.multiply(ba, h));
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
  static distanceToQuadraticBezier(pos: Vector2, A: Vector2, B: Vector2, C: Vector2): Object {
    let distance = 0;
    let point = { x: pos.x, y: pos.y };

    const a = this.subtract(B, A);
    const b = this.add(this.subtract(A, this.multiply(B, 2)), C);
    const c = this.multiply(a, 2);
    const d = this.subtract(A, pos);

    // Solve cubic roots to find closest points
    const kk = 1 / this.dot(b, b);
    const kx = kk * this.dot(a, b);
    const ky = (kk * (2 * this.dot(a, a) + this.dot(d, b))) / 3;
    const kz = kk * this.dot(d, a);

    const p = ky - kx * kx;
    const p3 = p * p * p;
    const q = kx * (2 * kx * kx - 3 * ky) + kz;
    let h = q * q + 4 * p3;

    if (h >= 0) {
      // 1 root
      h = Math.sqrt(h);
      const x = this.divide(this.subtract({ x: h, y: -h }, q), 2);
      const uv = this.multiply(this.sign(x), this.pow(this.abs(x), 1 / 3));
      const t = Math.min(Math.max(uv.x + uv.y - kx, 0), 1);
      point = this.add(A, this.multiply(this.add(c, this.multiply(b, t)), t));
      distance = this.dot2(
        this.add(d, this.multiply(this.add(c, this.multiply(b, t)), t))
      );
    } else {
      // 3 roots but ignore the 3rd one as it will never be closest
      // https://www.shadertoy.com/view/MdXBzB
      const z = Math.sqrt(-p);
      const v = Math.acos(q / (p * z * 2)) / 3;
      const m = Math.cos(v);
      const n = Math.sin(v) * 1.732050808;

      const t = this.clamp(
        this.subtract(this.multiply({ x: m + m, y: -n - m }, z), kx),
        0,
        1
      );
      const d1 = this.dot2(
        this.add(d, this.multiply(this.add(c, this.multiply(b, t.x)), t.x))
      );
      const d2 = this.dot2(
        this.add(d, this.multiply(this.add(c, this.multiply(b, t.y)), t.y))
      );
      distance = Math.min(d1, d2);
      if (d1 < d2) {
        point = this.add(
          d,
          this.multiply(this.add(c, this.multiply(b, t.x)), t.x)
        );
      } else {
        point = this.add(
          d,
          this.multiply(this.add(c, this.multiply(b, t.y)), t.y)
        );
      }
    }

    return { distance: Math.sqrt(distance), point: point };
  }

  /**
   * @typedef BoundingBox
   * @property {Vector2} min
   * @property {Vector2} max
   * @property {number} width
   * @property {number} height
   * @property {Vector2} center
   */

  /**
   * Calculates an axis-aligned bounding box around an array of point
   * @param {Vector2[]} points
   * @returns {BoundingBox}
   */
  static getBoundingBox(points: Vector2[]): BoundingBox {
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
    let width = maxX - minX;
    let height = maxY - minY;
    let center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
      width,
      height,
      center,
    };
  }

  /**
   * Checks to see if a point is in a polygon using ray casting
   * See more at {@link https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm}
   * and {@link https://stackoverflow.com/questions/217578/how-can-i-determine-whether-a-2d-point-is-within-a-polygon/2922778}
   * @param {Vector2} p
   * @param {Vector2[]} points
   * @returns {boolean}
   */
  static pointInPolygon(p: Vector2, points: Vector2[]): boolean {
    const bounds = this.getBoundingBox(points);
    if (
      p.x < bounds.min.x ||
      p.x > bounds.max.x ||
      p.y < bounds.min.y ||
      p.y > bounds.max.y
    ) {
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
   * @returns {boolean}
   */
  static compare(a: Vector2, b: Vector2, threshold: number): boolean {
    return this.lengthSquared(this.subtract(a, b)) < threshold * threshold;
  }

  /**
   * Returns the distance between two vectors
   * @param {Vector2} a
   * @param {Vector2} b
   * @returns {number}
   */
  static distance(a: Vector2, b: Vector2): number {
    return this.setLength(this.subtract(a, b));
  }

  /**
   * Linear interpolate between `a` and `b` by `alpha`
   * @param {Vector2} a
   * @param {Vector2} b
   * @param {number} alpha
   * @returns {Vector2}
   */
  static lerp(a: Vector2, b: Vector2, alpha: number): Vector2 {
    return { x: lerpNumber(a.x, b.x, alpha), y: lerpNumber(a.y, b.y, alpha) };
  }

  /**
   * Returns total length of a an array of points treated as a path
   * @param {Vector2[]} points the array of points in the path
   * @returns {number}
   */
  static pathLength(points: Vector2[]): number {
    let l = 0;
    for (let i = 1; i < points.length; i++) {
      l += this.distance(points[i - 1], points[i]);
    }
    return l;
  }

  /**
   * Resample a path to n number of evenly distributed points
   * based off of http://depts.washington.edu/acelab/proj/dollar/index.html
   * @param {Vector2[]} points the points to resample
   * @param {number} n the number of new points
   * @returns {Vector2[]}
   */
  static resample(points: Vector2[], n: number): Vector2[] {
    if (points.length === 0 || n <= 0) {
      return [];
    }
    let localPoints = [...points];
    const intervalLength = this.pathLength(localPoints) / (n - 1);
    let resampledPoints = [localPoints[0]];
    let currentDistance = 0;
    for (let i = 1; i < localPoints.length; i++) {
      let d = this.distance(localPoints[i - 1], localPoints[i]);
      if (currentDistance + d >= intervalLength) {
        let newPoint = this.lerp(
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

  /**
   * Rotate a vector 90 degrees
   * @param {Vector2} p Point
   * @param {("counterClockwise"|"clockwise")=} direction Direction to rotate the vector
   * @returns {Vector2}
   */
  static rotate90(p: Vector2, direction: "counterClockwise" | "clockwise" = "clockwise"): Vector2 {
    if (direction === "clockwise") {
      return { x: p.y, y: -p.x };
    } else {
      return { x: -p.y, y: p.x };
    }
  }
}

export default Vector2;

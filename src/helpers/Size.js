import Vector2 from "./Vector2";

/**
 * Wrapper for Vector2 that provides width, height and radius properties
 */
class Size extends Vector2 {
  _radius;
  /**
   * @param {number} width
   * @param {number} height
   * @param {number=} radius Used to represent hexagon sizes
   */
  constructor(width, height, radius) {
    super(width, height);
    this._radius = radius;
  }

  /**
   * @returns {number}
   */
  get width() {
    return this.x;
  }

  /**
   * @param {number} width
   */
  set width(width) {
    this.x = width;
  }

  /**
   * @returns {number}
   */
  get height() {
    return this.y;
  }

  /**
   * @param {number} height
   */
  set height(height) {
    this.y = height;
  }

  /**
   * @returns {number}
   */
  get radius() {
    if (this._radius) {
      return this._radius;
    } else {
      return Math.min(this.x, this.y) / 2;
    }
  }

  /**
   * @param {number} radius
   */
  set radius(radius) {
    this._radius = radius;
  }
}

export default Size;

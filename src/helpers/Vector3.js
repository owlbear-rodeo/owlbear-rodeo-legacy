/**
 * Vector class with x, y, z and static helper methods
 */
class Vector3 {
  /**
   * @type {number} x - X component of the vector
   */
  x;
  /**
   * @type {number} y - Y component of the vector
   */
  y;
  /**
   * @type {number} z - Z component of the vector
   */
  z;

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Round a Vector3 to the nearest integer while maintaining x + y + z = 0
   * @param {Vector3} cube
   * @returns {Vector3}
   */
  static cubeRound(cube) {
    var rX = Math.round(cube.x);
    var rY = Math.round(cube.y);
    var rZ = Math.round(cube.z);

    var xDiff = Math.abs(rX - cube.x);
    var yDiff = Math.abs(rY - cube.y);
    var zDiff = Math.abs(rZ - cube.z);

    if (xDiff > yDiff && xDiff > zDiff) {
      rX = -rY - rZ;
    } else if (yDiff > zDiff) {
      rY = -rX - rZ;
    } else {
      rZ = -rX - rY;
    }

    return new Vector3(rX, rY, rZ);
  }
}

export default Vector3;

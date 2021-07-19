import Konva from "konva";
import Vector2 from "./Vector2";

/**
 * @param {Konva.Node} node
 * @returns {Vector2}
 */
export function getRelativePointerPosition(
  node: Konva.Node
): Vector2 | undefined {
  let transform = node.getAbsoluteTransform().copy();
  transform.invert();
  let position = node.getStage()?.getPointerPosition();
  if (!position) {
    return;
  }
  return transform.point(position);
}

export function getRelativePointerPositionNormalized(
  node: Konva.Node
): Vector2 | undefined {
  const relativePosition = getRelativePointerPosition(node);
  if (!relativePosition) {
    return;
  }
  return {
    x: relativePosition.x / node.width(),
    y: relativePosition.y / node.height(),
  };
}

/**
 * Converts points from alternating array form to vector array form
 * @param {number[]} numbers points in an x, y alternating array
 * @returns {Vector2[]} a `Vector2` array
 */
export function convertNumbersToPoints(numbers: number[]): Vector2[] {
  return numbers.reduce((acc: Vector2[], _, i, arr) => {
    if (i % 2 === 0) {
      acc.push({ x: arr[i], y: arr[i + 1] });
    }
    return acc;
  }, []);
}

/**
 * Converts points from vector array form to alternating number array form
 * @param {Vector2[]} points
 * @returns {number[]}
 */
export function convertPointsToNumbers(points: Vector2[]): number[] {
  return points.reduce(
    (acc: number[], point: Vector2) => [...acc, point.x, point.y],
    []
  );
}

export function scaleAndFlattenPoints(
  points: Vector2[],
  scale: Vector2
): number[] {
  return convertPointsToNumbers(points.map((p) => Vector2.multiply(p, scale)));
}

import { snapPositionToGrid } from "./shared";
import * as Vector2 from "./vector2";
import { toDegrees } from "./shared";

export function getBrushPositionForTool(
  brushPosition,
  settings,
  gridSize,
  shapes
) {
  let position = brushPosition;
  if (settings && settings.useGridSnapping) {
    position = snapPositionToGrid(position, gridSize);
  }

  return position;
}

export function getDefaultShapeData(type, brushPosition) {
  if (type === "circle") {
    return { x: brushPosition.x, y: brushPosition.y, radius: 0 };
  } else if (type === "rectangle") {
    return {
      x: brushPosition.x,
      y: brushPosition.y,
      width: 0,
      height: 0,
    };
  } else if (type === "triangle") {
    return {
      points: [
        { x: brushPosition.x, y: brushPosition.y },
        { x: brushPosition.x, y: brushPosition.y },
        { x: brushPosition.x, y: brushPosition.y },
      ],
    };
  }
}

export function getUpdatedShapeData(type, data, brushPosition) {
  if (type === "circle") {
    const dif = Vector2.subtract(brushPosition, { x: data.x, y: data.y });
    const distance = Vector2.length(dif);
    return {
      ...data,
      radius: distance,
    };
  } else if (type === "rectangle") {
    const dif = Vector2.subtract(brushPosition, { x: data.x, y: data.y });
    return {
      ...data,
      width: dif.x,
      height: dif.y,
    };
  } else if (type === "triangle") {
    const points = data.points;
    const dif = Vector2.subtract(brushPosition, points[0]);
    const length = Vector2.length(dif);
    const direction = Vector2.normalize(dif);
    // Get the angle for a triangle who's width is the same as it's length
    const angle = Math.atan(length / 2 / length);
    const sideLength = length / Math.cos(angle);

    const leftDir = Vector2.rotateDirection(direction, toDegrees(angle));
    const rightDir = Vector2.rotateDirection(direction, -toDegrees(angle));

    return {
      points: [
        points[0],
        Vector2.add(Vector2.multiply(leftDir, sideLength), points[0]),
        Vector2.add(Vector2.multiply(rightDir, sideLength), points[0]),
      ],
    };
  }
}

const defaultStrokeSize = 1 / 10;
export function getStrokeSize(multiplier, gridSize, width, height) {
  const gridPixelSize = Vector2.multiply(gridSize, { x: width, y: height });
  return Vector2.min(gridPixelSize) * defaultStrokeSize * multiplier;
}

export function shapeHasFill(shape) {
  return (
    shape.type === "shape" ||
    (shape.type === "path" && shape.pathType === "fill")
  );
}

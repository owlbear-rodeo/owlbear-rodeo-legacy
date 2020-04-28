import * as Vector2 from "./vector2";
import { toDegrees } from "./shared";
import colors from "./colors";

const snappingThreshold = 1 / 5;
export function getBrushPositionForTool(brushPosition, tool, gridSize, shapes) {
  let position = brushPosition;
  if (tool === "shape") {
    const snapped = Vector2.roundTo(position, gridSize);
    const minGrid = Vector2.min(gridSize);
    const distance = Vector2.length(Vector2.subtract(snapped, position));
    if (distance < minGrid * snappingThreshold) {
      position = snapped;
    }
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
export function getStrokeSize(multiplier, gridSize, canvasWidth, canvasHeight) {
  const gridPixelSize = Vector2.multiply(gridSize, {
    x: canvasWidth,
    y: canvasHeight,
  });
  return Vector2.min(gridPixelSize) * defaultStrokeSize * multiplier;
}

export function shapeHasFill(shape) {
  return (
    shape.type === "shape" ||
    (shape.type === "path" && shape.pathType === "fill")
  );
}

export function pointsToPath(points, close, canvasWidth, canvasHeight) {
  const path = new Path2D();
  if (points.length < 2) {
    return path;
  }
  path.moveTo(points[0].x * canvasWidth, points[0].y * canvasHeight);

  // Draw a smooth curve between the points
  for (let i = 1; i < points.length - 2; i++) {
    const pointScaled = Vector2.multiply(points[i], {
      x: canvasWidth,
      y: canvasHeight,
    });
    const nextPointScaled = Vector2.multiply(points[i + 1], {
      x: canvasWidth,
      y: canvasHeight,
    });
    var xc = (pointScaled.x + nextPointScaled.x) / 2;
    var yc = (pointScaled.y + nextPointScaled.y) / 2;
    path.quadraticCurveTo(pointScaled.x, pointScaled.y, xc, yc);
  }
  // Curve through the last two points
  path.quadraticCurveTo(
    points[points.length - 2].x * canvasWidth,
    points[points.length - 2].y * canvasHeight,
    points[points.length - 1].x * canvasWidth,
    points[points.length - 1].y * canvasHeight
  );

  if (close) {
    path.closePath();
  }
  return path;
}

export function circleToPath(x, y, radius, canvasWidth, canvasHeight) {
  const path = new Path2D();
  const minSide = canvasWidth < canvasHeight ? canvasWidth : canvasHeight;
  path.arc(
    x * canvasWidth,
    y * canvasHeight,
    radius * minSide,
    0,
    2 * Math.PI,
    true
  );
  return path;
}

export function rectangleToPath(
  x,
  y,
  width,
  height,
  canvasWidth,
  canvasHeight
) {
  const path = new Path2D();
  path.rect(
    x * canvasWidth,
    y * canvasHeight,
    width * canvasWidth,
    height * canvasHeight
  );
  return path;
}

export function triangleToPath(points, canvasWidth, canvasHeight) {
  const path = new Path2D();
  path.moveTo(points[0].x * canvasWidth, points[0].y * canvasHeight);
  for (let point of points.slice(1)) {
    path.lineTo(point.x * canvasWidth, point.y * canvasHeight);
  }
  path.closePath();

  return path;
}

export function shapeToPath(shape, canvasWidth, canvasHeight) {
  const data = shape.data;
  if (shape.type === "path") {
    return pointsToPath(
      data.points,
      shape.pathType === "fill",
      canvasWidth,
      canvasHeight
    );
  } else if (shape.type === "shape") {
    if (shape.shapeType === "circle") {
      return circleToPath(
        data.x,
        data.y,
        data.radius,
        canvasWidth,
        canvasHeight
      );
    } else if (shape.shapeType === "rectangle") {
      return rectangleToPath(
        data.x,
        data.y,
        data.width,
        data.height,
        canvasWidth,
        canvasHeight
      );
    } else if (shape.shapeType === "triangle") {
      return triangleToPath(data.points, canvasWidth, canvasHeight);
    }
  }
}

export function isShapeHovered(
  shape,
  context,
  hoverPosition,
  canvasWidth,
  canvasHeight
) {
  const path = shapeToPath(shape, canvasWidth, canvasHeight);
  if (shapeHasFill(shape)) {
    return context.isPointInPath(
      path,
      hoverPosition.x * canvasWidth,
      hoverPosition.y * canvasHeight
    );
  } else {
    return context.isPointInStroke(
      path,
      hoverPosition.x * canvasWidth,
      hoverPosition.y * canvasHeight
    );
  }
}

export function drawShape(shape, context, gridSize, canvasWidth, canvasHeight) {
  const path = shapeToPath(shape, canvasWidth, canvasHeight);
  const color = colors[shape.color] || shape.color;
  const fill = shapeHasFill(shape);

  context.globalAlpha = shape.blend ? 0.5 : 1.0;
  context.fillStyle = color;
  context.strokeStyle = color;
  if (shape.strokeWidth > 0) {
    context.lineCap = "round";
    context.lineWidth = getStrokeSize(
      shape.strokeWidth,
      gridSize,
      canvasWidth,
      canvasHeight
    );
    context.stroke(path);
  }
  if (fill) {
    context.fill(path);
  }
}

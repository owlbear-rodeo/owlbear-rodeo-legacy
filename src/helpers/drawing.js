import simplify from "simplify-js";

import * as Vector2 from "./vector2";
import { toDegrees } from "./shared";
import colors from "./colors";

const snappingThreshold = 1 / 5;
export function getBrushPositionForTool(
  brushPosition,
  tool,
  toolSettings,
  gridSize,
  shapes
) {
  let position = brushPosition;
  if (tool === "shape") {
    const snapped = Vector2.roundTo(position, gridSize);
    const minGrid = Vector2.min(gridSize);
    const distance = Vector2.length(Vector2.subtract(snapped, position));
    if (distance < minGrid * snappingThreshold) {
      position = snapped;
    }
  }
  if (tool === "fog" && toolSettings.type === "add") {
    if (toolSettings.useGridSnapping) {
      position = Vector2.roundTo(position, gridSize);
    }
    if (toolSettings.useEdgeSnapping) {
      const minGrid = Vector2.min(gridSize);
      let closestDistance = Number.MAX_VALUE;
      let closestPosition = position;
      // Find the closest point on all fog shapes
      for (let shape of shapes) {
        if (shape.type === "fog") {
          const points = shape.data.points;
          const isInShape = Vector2.pointInPolygon(position, points);

          // Find the closest point to each line of the shape
          for (let i = 0; i < points.length; i++) {
            const a = points[i];
            // Wrap around points to the start to account for closed shape
            const b = points[(i + 1) % points.length];
            const distanceToLine = Vector2.distanceToLine(position, a, b);
            const isCloseToShape = distanceToLine < minGrid * snappingThreshold;
            if (
              (isInShape || isCloseToShape) &&
              distanceToLine < closestDistance
            ) {
              closestPosition = Vector2.closestPointOnLine(position, a, b);
              closestDistance = distanceToLine;
            }
          }
        }
      }
      position = closestPosition;
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

export function getGridScale(gridSize) {
  if (gridSize.x < gridSize.y) {
    return { x: gridSize.y / gridSize.x, y: 1 };
  } else if (gridSize.y < gridSize.x) {
    return { x: 1, y: gridSize.x / gridSize.y };
  } else {
    return { x: 1, y: 1 };
  }
}

export function getUpdatedShapeData(type, data, brushPosition, gridSize) {
  const gridScale = getGridScale(gridSize);
  if (type === "circle") {
    const dif = Vector2.subtract(brushPosition, {
      x: data.x,
      y: data.y,
    });
    const scaled = Vector2.multiply(dif, gridScale);
    const distance = Vector2.length(scaled);
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
    // Scale the distance by the grid scale then unscale before adding
    const scaled = Vector2.multiply(dif, gridScale);
    const length = Vector2.length(scaled);
    const direction = Vector2.normalize(scaled);
    // Get the angle for a triangle who's width is the same as it's length
    const angle = Math.atan(length / 2 / length);
    const sideLength = length / Math.cos(angle);

    const leftDir = Vector2.rotateDirection(direction, toDegrees(angle));
    const rightDir = Vector2.rotateDirection(direction, -toDegrees(angle));

    const leftDirUnscaled = Vector2.divide(leftDir, gridScale);
    const rightDirUnscaled = Vector2.divide(rightDir, gridScale);

    return {
      points: [
        points[0],
        Vector2.add(Vector2.multiply(leftDirUnscaled, sideLength), points[0]),
        Vector2.add(Vector2.multiply(rightDirUnscaled, sideLength), points[0]),
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
    shape.type === "fog" ||
    shape.type === "shape" ||
    (shape.type === "path" && shape.pathType === "fill")
  );
}

export function pointsToPathSmooth(points, close, canvasWidth, canvasHeight) {
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

export function pointsToPathSharp(points, close, canvasWidth, canvasHeight) {
  const path = new Path2D();
  path.moveTo(points[0].x * canvasWidth, points[0].y * canvasHeight);
  for (let point of points.slice(1)) {
    path.lineTo(point.x * canvasWidth, point.y * canvasHeight);
  }
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

export function shapeToPath(shape, canvasWidth, canvasHeight) {
  const data = shape.data;
  if (shape.type === "path") {
    return pointsToPathSmooth(
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
      return pointsToPathSharp(data.points, true, canvasWidth, canvasHeight);
    }
  } else if (shape.type === "fog") {
    if (shape.fogType === "smooth") {
      return pointsToPathSmooth(
        shape.data.points,
        true,
        canvasWidth,
        canvasHeight
      );
    } else if (shape.fogType === "sharp") {
      return pointsToPathSharp(
        shape.data.points,
        true,
        canvasWidth,
        canvasHeight
      );
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

const defaultSimplifySize = 1 / 100;
export function simplifyPoints(points, gridSize) {
  return simplify(points, Vector2.min(gridSize) * defaultSimplifySize);
}

export function getRelativePointerPosition(event, container) {
  if (container) {
    const containerRect = container.getBoundingClientRect();
    const x = (event.clientX - containerRect.x) / containerRect.width;
    const y = (event.clientY - containerRect.y) / containerRect.height;
    return { x, y };
  }
}

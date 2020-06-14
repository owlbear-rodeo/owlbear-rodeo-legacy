import React from "react";
import { Line } from "react-konva";

// Holes should be wound in the opposite direction as the containing points array
export function HoleyLine({ holes, ...props }) {
  // Converted from https://github.com/rfestag/konva/blob/master/src/shapes/Line.ts
  function drawLine(points, context, shape) {
    const length = points.length;
    const tension = shape.tension();
    const closed = shape.closed();
    const bezier = shape.bezier();

    if (!length) {
      return;
    }

    context.moveTo(points[0], points[1]);

    if (tension !== 0 && length > 4) {
      const tensionPoints = shape.getTensionPoints();
      const tensionLength = tensionPoints.length;
      let n = closed ? 0 : 4;

      if (!closed) {
        context.quadraticCurveTo(
          tensionPoints[0],
          tensionPoints[1],
          tensionPoints[2],
          tensionPoints[3]
        );
      }

      while (n < tensionLength - 2) {
        context.bezierCurveTo(
          tensionPoints[n++],
          tensionPoints[n++],
          tensionPoints[n++],
          tensionPoints[n++],
          tensionPoints[n++],
          tensionPoints[n++]
        );
      }

      if (!closed) {
        context.quadraticCurveTo(
          tensionPoints[tensionLength - 2],
          tensionPoints[tensionLength - 1],
          points[length - 2],
          points[length - 1]
        );
      }
    } else if (bezier) {
      // no tension but bezier
      let n = 2;

      while (n < length) {
        context.bezierCurveTo(
          points[n++],
          points[n++],
          points[n++],
          points[n++],
          points[n++],
          points[n++]
        );
      }
    } else {
      // no tension
      for (let n = 2; n < length; n += 2) {
        context.lineTo(points[n], points[n + 1]);
      }
    }
  }

  // Draw points and holes
  function sceneFunc(context, shape) {
    const points = shape.points();
    const closed = shape.closed();

    if (!points.length) {
      return;
    }

    context.beginPath();
    console.log();
    drawLine(points, context, shape);

    context.beginPath();
    drawLine(points, context, shape);

    // closed e.g. polygons and blobs
    if (closed) {
      context.closePath();
      if (holes && holes.length) {
        for (let hole of holes) {
          drawLine(hole, context, shape);
          context.closePath();
        }
      }
      context.fillStrokeShape(shape);
    } else {
      // open e.g. lines and splines
      context.strokeShape(shape);
    }
  }

  return <Line sceneFunc={sceneFunc} {...props} />;
}

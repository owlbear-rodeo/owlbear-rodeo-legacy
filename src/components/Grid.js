import React from "react";
import { Line, Group } from "react-konva";

import { getStrokeWidth } from "../helpers/drawing";

function Grid({ gridX, gridY, gridInset, strokeWidth, width, height, stroke }) {
  if (!gridX || !gridY) {
    return null;
  }

  const gridSizeNormalized = {
    x: (gridInset.bottomRight.x - gridInset.topLeft.x) / gridX,
    y: (gridInset.bottomRight.y - gridInset.topLeft.y) / gridY,
  };

  const insetWidth = (gridInset.bottomRight.x - gridInset.topLeft.x) * width;
  const insetHeight = (gridInset.bottomRight.y - gridInset.topLeft.y) * height;

  const lineSpacingX = insetWidth / gridX;
  const lineSpacingY = insetHeight / gridY;

  const offsetX = gridInset.topLeft.x * width * -1;
  const offsetY = gridInset.topLeft.y * height * -1;

  const lines = [];
  for (let x = 1; x < gridX; x++) {
    lines.push(
      <Line
        key={`grid_x_${x}`}
        points={[x * lineSpacingX, 0, x * lineSpacingX, insetHeight]}
        stroke={stroke}
        strokeWidth={getStrokeWidth(
          strokeWidth,
          gridSizeNormalized,
          width,
          height
        )}
        opacity={0.5}
        offsetX={offsetX}
        offsetY={offsetY}
      />
    );
  }
  for (let y = 1; y < gridY; y++) {
    lines.push(
      <Line
        key={`grid_y_${y}`}
        points={[0, y * lineSpacingY, insetWidth, y * lineSpacingY]}
        stroke={stroke}
        strokeWidth={getStrokeWidth(
          strokeWidth,
          gridSizeNormalized,
          width,
          height
        )}
        opacity={0.5}
        offsetX={offsetX}
        offsetY={offsetY}
      />
    );
  }

  return <Group>{lines}</Group>;
}

Grid.defaultProps = {
  strokeWidth: 0.1,
  gridInset: { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: 1 } },
  stroke: "white",
};

export default Grid;

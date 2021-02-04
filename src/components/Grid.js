import React from "react";
import { Line, Group, RegularPolygon } from "react-konva";

import { getStrokeWidth } from "../helpers/drawing";
import { getCellSize, getCellLocation, shouldClampCell } from "../helpers/grid";

function Grid({ grid, strokeWidth, width, height, stroke }) {
  if (!grid?.size.x || !grid?.size.y) {
    return null;
  }

  const gridSizeNormalized = {
    x: (grid.inset.bottomRight.x - grid.inset.topLeft.x) / grid.size.x,
    y: (grid.inset.bottomRight.y - grid.inset.topLeft.y) / grid.size.y,
  };

  const insetWidth = (grid.inset.bottomRight.x - grid.inset.topLeft.x) * width;
  const insetHeight =
    (grid.inset.bottomRight.y - grid.inset.topLeft.y) * height;

  const offsetX = grid.inset.topLeft.x * width * -1;
  const offsetY = grid.inset.topLeft.y * height * -1;

  const cellSize = getCellSize(grid, insetWidth, insetHeight);

  const shapes = [];
  if (grid.type === "square") {
    for (let x = 1; x < grid.size.x; x++) {
      shapes.push(
        <Line
          key={`grid_x_${x}`}
          points={[x * cellSize.width, 0, x * cellSize.width, insetHeight]}
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
    for (let y = 1; y < grid.size.y; y++) {
      shapes.push(
        <Line
          key={`grid_y_${y}`}
          points={[0, y * cellSize.height, insetWidth, y * cellSize.height]}
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
  } else if (grid.type === "hexVertical" || grid.type === "hexHorizontal") {
    for (let x = 0; x < grid.size.x; x++) {
      for (let y = 0; y < grid.size.y; y++) {
        const cellLocation = getCellLocation(grid, x, y, cellSize);

        // If our hex shape will go past the bounds of the grid
        const overshot = shouldClampCell(grid, x, y);
        shapes.push(
          <Group
            key={`grid_${x}_${y}`}
            // Clip the hex if it will overshoot
            clipFunc={
              overshot &&
              ((context) => {
                context.rect(
                  -cellSize.radius,
                  -cellSize.radius,
                  grid.type === "hexVertical"
                    ? cellSize.radius
                    : cellSize.radius * 2,
                  grid.type === "hexVertical"
                    ? cellSize.radius * 2
                    : cellSize.radius
                );
              })
            }
            x={cellLocation.x}
            y={cellLocation.y}
            offsetX={offsetX}
            offsetY={offsetY}
          >
            <RegularPolygon
              sides={6}
              radius={cellSize.radius}
              stroke={stroke}
              strokeWidth={getStrokeWidth(
                strokeWidth,
                gridSizeNormalized,
                width,
                height
              )}
              opacity={0.5}
              rotation={grid.type === "hexVertical" ? 0 : 90}
            />
          </Group>
        );
      }
    }
  }

  return <Group>{shapes}</Group>;
}

Grid.defaultProps = {
  strokeWidth: 0.1,
  stroke: "white",
};

export default Grid;

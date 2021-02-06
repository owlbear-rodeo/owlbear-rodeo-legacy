import React from "react";
import { Line, Group, RegularPolygon } from "react-konva";

import {
  getCellLocation,
  gridClipFunction,
  shouldClipCell,
} from "../helpers/grid";

import { useGrid } from "../contexts/GridContext";

function Grid({ strokeWidth, stroke }) {
  const {
    grid,
    gridStrokeWidth,
    gridPixelSize,
    gridOffset,
    gridCellPixelSize,
  } = useGrid();

  if (!grid?.size.x || !grid?.size.y) {
    return null;
  }

  const shapes = [];
  if (grid.type === "square") {
    for (let x = 1; x < grid.size.x; x++) {
      shapes.push(
        <Line
          key={`grid_x_${x}`}
          points={[
            x * gridCellPixelSize.width,
            0,
            x * gridCellPixelSize.width,
            gridPixelSize.height,
          ]}
          stroke={stroke}
          strokeWidth={gridStrokeWidth * strokeWidth}
          opacity={0.5}
          offset={gridOffset}
        />
      );
    }
    for (let y = 1; y < grid.size.y; y++) {
      shapes.push(
        <Line
          key={`grid_y_${y}`}
          points={[
            0,
            y * gridCellPixelSize.height,
            gridPixelSize.width,
            y * gridCellPixelSize.height,
          ]}
          stroke={stroke}
          strokeWidth={gridStrokeWidth * strokeWidth}
          opacity={0.5}
          offset={gridOffset}
        />
      );
    }
  } else if (grid.type === "hexVertical" || grid.type === "hexHorizontal") {
    // Start at -1 to overshoot the bounds of the grid to ensure all lines are drawn
    for (let x = -1; x < grid.size.x; x++) {
      for (let y = -1; y < grid.size.y; y++) {
        const cellLocation = getCellLocation(grid, x, y, gridCellPixelSize);
        shapes.push(
          <Group
            key={`grid_${x}_${y}`}
            clipFunc={
              shouldClipCell(grid, x, y) &&
              ((context) =>
                gridClipFunction(context, grid, x, y, gridCellPixelSize))
            }
            x={cellLocation.x}
            y={cellLocation.y}
            offset={gridOffset}
          >
            <RegularPolygon
              sides={6}
              radius={gridCellPixelSize.radius}
              stroke={stroke}
              strokeWidth={gridStrokeWidth * strokeWidth}
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

import React, { useEffect, useRef } from "react";
import { Line, Group, RegularPolygon } from "react-konva";

import { getCellLocation } from "../helpers/grid";
import Vector2 from "../helpers/Vector2";

import { useGrid } from "../contexts/GridContext";
import { useMapInteraction } from "../contexts/MapInteractionContext";

import useDebounce from "../hooks/useDebounce";

function Grid({ strokeWidth, stroke }) {
  const {
    grid,
    gridStrokeWidth,
    gridPixelSize,
    gridOffset,
    gridCellPixelSize,
  } = useGrid();

  const gridGroupRef = useRef();
  const { stageScale, mapWidth } = useMapInteraction();
  const debouncedStageScale = useDebounce(stageScale, 50);
  useEffect(() => {
    const gridGroup = gridGroupRef.current;
    if (gridGroup && grid?.size.x && grid?.size.y && debouncedStageScale) {
      const gridRect = gridGroup.getClientRect();
      if (gridRect.width > 0 && gridRect.height > 0) {
        // 150 pixels per grid cell
        const maxMapSize = Math.min(
          Math.max(grid.size.x, grid.size.y) * 150,
          7680 // Max 8K
        );
        const maxGridSize =
          Math.max(gridRect.width, gridRect.height) / debouncedStageScale;
        const maxPixelRatio = maxMapSize / maxGridSize;
        gridGroup.cache({
          pixelRatio: Math.min(
            Math.max(debouncedStageScale * 2, 1),
            maxPixelRatio
          ),
        });
      }
    }
  }, [grid, debouncedStageScale, mapWidth]);

  if (!grid?.size.x || !grid?.size.y) {
    return null;
  }

  const negativeGridOffset = Vector2.multiply(gridOffset, -1);
  const finalStrokeWidth = gridStrokeWidth * strokeWidth;

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
          strokeWidth={finalStrokeWidth}
          opacity={0.5}
          offset={negativeGridOffset}
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
          strokeWidth={finalStrokeWidth}
          opacity={0.5}
          offset={negativeGridOffset}
        />
      );
    }
  } else if (grid.type === "hexVertical" || grid.type === "hexHorizontal") {
    // End at grid size + 1 to overshoot the bounds of the grid to ensure all lines are drawn
    for (let x = 0; x < grid.size.x + 1; x++) {
      for (let y = 0; y < grid.size.y + 1; y++) {
        const cellLocation = getCellLocation(grid, x, y, gridCellPixelSize);
        shapes.push(
          <Group
            key={`grid_${x}_${y}`}
            x={cellLocation.x}
            y={cellLocation.y}
            offset={negativeGridOffset}
          >
            {/* Offset the hex tile to align to top left of grid */}
            <Group offset={Vector2.multiply(gridCellPixelSize, -0.5)}>
              <RegularPolygon
                sides={6}
                radius={gridCellPixelSize.radius}
                stroke={stroke}
                strokeWidth={finalStrokeWidth}
                opacity={0.5}
                rotation={grid.type === "hexVertical" ? 0 : 90}
              />
            </Group>
          </Group>
        );
      }
    }
  }

  return (
    <Group
      // Clip grid to bounds to cover hex overshoot
      clipFunc={(context) => {
        context.rect(
          gridOffset.x - finalStrokeWidth / 2,
          gridOffset.y - finalStrokeWidth / 2,
          gridPixelSize.width + finalStrokeWidth,
          gridPixelSize.height + finalStrokeWidth
        );
      }}
      ref={gridGroupRef}
    >
      {shapes}
    </Group>
  );
}

Grid.defaultProps = {
  strokeWidth: 0.1,
  stroke: "white",
};

export default Grid;

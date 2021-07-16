import React, { useContext, useState, useEffect } from "react";

import Vector2 from "../helpers/Vector2";
import Size from "../helpers/Size";
import { getGridPixelSize, getCellPixelSize } from "../helpers/grid";
import { Grid } from "../types/Grid";

/**
 * @typedef GridContextValue
 * @property {Grid} grid Base grid value
 * @property {Size} gridPixelSize Size of the grid in pixels
 * @property {Size} gridCellPixelSize Size of each cell in pixels
 * @property {Size} gridCellNormalizedSize Size of each cell normalized to the grid
 * @property {Vector2} gridOffset Offset of the grid from the top left in pixels
 * @property {number} gridStrokeWidth Stroke width of the grid in pixels
 * @property {Vector2} gridCellPixelOffset Offset of the grid cells to convert the center position of hex cells to the top left
 */
type GridContextValue = {
  grid: Grid;
  gridPixelSize: Size;
  gridCellPixelSize: Size;
  gridCellNormalizedSize: Size;
  gridOffset: Vector2;
  gridStrokeWidth: number;
  gridCellPixelOffset: Vector2;
};

/**
 * @type {GridContextValue}
 */
const defaultValue: GridContextValue = {
  grid: {
    size: new Vector2(0, 0),
    inset: { topLeft: new Vector2(0, 0), bottomRight: new Vector2(1, 1) },
    type: "square",
    measurement: {
      scale: "",
      type: "euclidean",
    },
  },
  gridPixelSize: new Size(0, 0),
  gridCellPixelSize: new Size(0, 0, 0),
  gridCellNormalizedSize: new Size(0, 0, 0),
  gridOffset: new Vector2(0, 0),
  gridStrokeWidth: 0,
  gridCellPixelOffset: new Vector2(0, 0),
};

export const GridContext = React.createContext(defaultValue.grid);
export const GridPixelSizeContext = React.createContext(
  defaultValue.gridPixelSize
);
export const GridCellPixelSizeContext = React.createContext(
  defaultValue.gridCellPixelSize
);
export const GridCellNormalizedSizeContext = React.createContext(
  defaultValue.gridCellNormalizedSize
);
export const GridOffsetContext = React.createContext(defaultValue.gridOffset);
export const GridStrokeWidthContext = React.createContext(
  defaultValue.gridStrokeWidth
);
export const GridCellPixelOffsetContext = React.createContext(
  defaultValue.gridCellPixelOffset
);

const defaultStrokeWidth = 1 / 10;

export function GridProvider({
  grid: inputGrid,
  width,
  height,
  children,
}: {
  grid: Grid;
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  let grid = inputGrid;

  if (!grid.size.x || !grid.size.y) {
    grid = defaultValue.grid;
  }

  const [gridPixelSize, setGridPixelSize] = useState(
    defaultValue.gridCellPixelSize
  );
  const [gridCellPixelSize, setGridCellPixelSize] = useState(
    defaultValue.gridCellPixelSize
  );
  const [gridCellNormalizedSize, setGridCellNormalizedSize] = useState(
    defaultValue.gridCellNormalizedSize
  );
  const [gridOffset, setGridOffset] = useState(defaultValue.gridOffset);
  const [gridStrokeWidth, setGridStrokeWidth] = useState(
    defaultValue.gridStrokeWidth
  );
  const [gridCellPixelOffset, setGridCellPixelOffset] = useState(
    defaultValue.gridCellPixelOffset
  );

  useEffect(() => {
    const _gridPixelSize = getGridPixelSize(grid, width, height);
    const _gridCellPixelSize = getCellPixelSize(
      grid,
      _gridPixelSize.width,
      _gridPixelSize.height
    );
    const _gridCellNormalizedSize = new Size(
      _gridCellPixelSize.width / width,
      _gridCellPixelSize.height / height
    );
    const _gridOffset = Vector2.multiply(grid.inset.topLeft, {
      x: width,
      y: height,
    });
    const _gridStrokeWidth =
      (_gridCellPixelSize.width < _gridCellPixelSize.height
        ? _gridCellPixelSize.width
        : _gridCellPixelSize.height) * defaultStrokeWidth;

    let _gridCellPixelOffset = { x: 0, y: 0 };
    // Move hex tiles to top left
    if (grid.type === "hexVertical" || grid.type === "hexHorizontal") {
      _gridCellPixelOffset = Vector2.multiply(_gridCellPixelSize, 0.5);
    }

    setGridPixelSize(_gridPixelSize);
    setGridCellPixelSize(_gridCellPixelSize);
    setGridCellNormalizedSize(_gridCellNormalizedSize);
    setGridOffset(_gridOffset);
    setGridStrokeWidth(_gridStrokeWidth);
    setGridCellPixelOffset(_gridCellPixelOffset);
  }, [grid, width, height]);

  return (
    <GridContext.Provider value={grid}>
      <GridPixelSizeContext.Provider value={gridPixelSize}>
        <GridCellPixelSizeContext.Provider value={gridCellPixelSize}>
          <GridCellNormalizedSizeContext.Provider
            value={gridCellNormalizedSize}
          >
            <GridOffsetContext.Provider value={gridOffset}>
              <GridStrokeWidthContext.Provider value={gridStrokeWidth}>
                <GridCellPixelOffsetContext.Provider
                  value={gridCellPixelOffset}
                >
                  {children}
                </GridCellPixelOffsetContext.Provider>
              </GridStrokeWidthContext.Provider>
            </GridOffsetContext.Provider>
          </GridCellNormalizedSizeContext.Provider>
        </GridCellPixelSizeContext.Provider>
      </GridPixelSizeContext.Provider>
    </GridContext.Provider>
  );
}

export function useGrid() {
  const context = useContext(GridContext);
  if (context === undefined) {
    throw new Error("useGrid must be used within a GridProvider");
  }
  return context;
}

export function useGridPixelSize() {
  const context = useContext(GridPixelSizeContext);
  if (context === undefined) {
    throw new Error("useGridPixelSize must be used within a GridProvider");
  }
  return context;
}

export function useGridCellPixelSize() {
  const context = useContext(GridCellPixelSizeContext);
  if (context === undefined) {
    throw new Error("useGridCellPixelSize must be used within a GridProvider");
  }
  return context;
}

export function useGridCellNormalizedSize() {
  const context = useContext(GridCellNormalizedSizeContext);
  if (context === undefined) {
    throw new Error(
      "useGridCellNormalizedSize must be used within a GridProvider"
    );
  }
  return context;
}

export function useGridOffset() {
  const context = useContext(GridOffsetContext);
  if (context === undefined) {
    throw new Error("useGridOffset must be used within a GridProvider");
  }
  return context;
}

export function useGridStrokeWidth() {
  const context = useContext(GridStrokeWidthContext);
  if (context === undefined) {
    throw new Error("useGridStrokeWidth must be used within a GridProvider");
  }
  return context;
}

export function useGridCellPixelOffset() {
  const context = useContext(GridCellPixelOffsetContext);
  if (context === undefined) {
    throw new Error(
      "useGridCellPixelOffset must be used within a GridProvider"
    );
  }
  return context;
}

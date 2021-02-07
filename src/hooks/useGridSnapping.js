// Load Konva for auto complete
// eslint-disable-next-line no-unused-vars
import Konva from "konva";

import Vector2 from "../helpers/Vector2";
import {
  getCellLocation,
  getNearestCellCoordinates,
  getCellCorners,
} from "../helpers/grid";

import { useGrid } from "../contexts/GridContext";

/**
 * Returns a function that when called will snap a node to the current grid
 * @param {number} snappingThreshold 1 = Always snap, 0 = never snap
 */
function useGridSnapping(snappingThreshold) {
  const { grid, gridOffset, gridCellPixelSize } = useGrid();

  /**
   * @param {Konva.Node} node The node to snap
   */
  function snapNodeToGrid(node) {
    const position = node.position();
    // Account for grid offset
    let offsetPosition = Vector2.subtract(position, gridOffset);
    // Move hex tiles to top left
    if (grid.type === "hexVertical" || grid.type === "hexHorizontal") {
      offsetPosition = Vector2.subtract(
        offsetPosition,
        Vector2.multiply(gridCellPixelSize, 0.5)
      );
    }
    const nearsetCell = getNearestCellCoordinates(
      grid,
      offsetPosition.x,
      offsetPosition.y,
      gridCellPixelSize
    );
    const cellPosition = getCellLocation(
      grid,
      nearsetCell.x,
      nearsetCell.y,
      gridCellPixelSize
    );
    const cellCorners = getCellCorners(
      grid,
      cellPosition.x,
      cellPosition.y,
      gridCellPixelSize
    );

    const snapPoints = [cellPosition, ...cellCorners];

    for (let snapPoint of snapPoints) {
      const distanceToSnapPoint = Vector2.distance(offsetPosition, snapPoint);
      if (
        distanceToSnapPoint <
        Vector2.min(gridCellPixelSize) * snappingThreshold
      ) {
        // Reverse grid offset
        let offsetSnapPoint = Vector2.add(snapPoint, gridOffset);
        // Reverse offset for hex tiles
        if (grid.type === "hexVertical" || grid.type === "hexHorizontal") {
          offsetSnapPoint = Vector2.add(
            offsetSnapPoint,
            Vector2.multiply(gridCellPixelSize, 0.5)
          );
        }
        node.position(offsetSnapPoint);
        return;
      }
    }
  }

  return snapNodeToGrid;
}

export default useGridSnapping;

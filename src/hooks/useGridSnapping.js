import Vector2 from "../helpers/Vector2";
import {
  getCellLocation,
  getNearestCellCoordinates,
  getCellCorners,
} from "../helpers/grid";

import useSetting from "./useSetting";

import { useGrid } from "../contexts/GridContext";

/**
 * Returns a function that when called will snap a node to the current grid
 * @param {number=} snappingSensitivity 1 = Always snap, 0 = never snap if undefined the default user setting will be used
 */
function useGridSnapping(snappingSensitivity) {
  const [defaultSnappingSensitivity] = useSetting(
    "map.gridSnappingSensitivity"
  );
  snappingSensitivity = snappingSensitivity || defaultSnappingSensitivity;

  const { grid, gridOffset, gridCellPixelSize } = useGrid();

  /**
   * @param {Vector2} node The node to snap
   */
  function snapPositionToGrid(position) {
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
        Vector2.min(gridCellPixelSize) * snappingSensitivity
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
        return offsetSnapPoint;
      }
    }

    return position;
  }

  return snapPositionToGrid;
}

export default useGridSnapping;

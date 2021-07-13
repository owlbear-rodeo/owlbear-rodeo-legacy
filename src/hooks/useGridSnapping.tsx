import Vector2 from "../helpers/Vector2";
import {
  getCellLocation,
  getNearestCellCoordinates,
  getCellCorners,
} from "../helpers/grid";

import useSetting from "./useSetting";

import {
  useGrid,
  useGridOffset,
  useGridCellPixelSize,
  useGridCellPixelOffset,
} from "../contexts/GridContext";

/**
 * Returns a function that when called will snap a node to the current grid
 * @param {number=} snappingSensitivity 1 = Always snap, 0 = never snap if undefined the default user setting will be used
 * @param {boolean=} useCorners Snap to grid cell corners
 */
function useGridSnapping(
  snappingSensitivity: number | undefined = undefined,
  useCorners: boolean = true
) {
  const [defaultSnappingSensitivity] = useSetting<number>(
    "map.gridSnappingSensitivity"
  );
  let gridSnappingSensitivity =
    snappingSensitivity === undefined
      ? defaultSnappingSensitivity
      : snappingSensitivity;

  const grid = useGrid();
  const gridOffset = useGridOffset();
  const gridCellPixelSize = useGridCellPixelSize();
  const gridCellPixelOffset = useGridCellPixelOffset();

  /**
   * @param {Vector2} node The node to snap
   */
  function snapPositionToGrid(position: Vector2) {
    // Account for grid offset
    let offsetPosition = Vector2.subtract(
      Vector2.subtract(position, gridOffset),
      gridCellPixelOffset
    );
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

    const snapPoints = [cellPosition];
    if (useCorners) {
      snapPoints.push(...cellCorners);
    }

    for (let snapPoint of snapPoints) {
      const distanceToSnapPoint = Vector2.distance(offsetPosition, snapPoint);
      if (
        distanceToSnapPoint <
        (Vector2.min(gridCellPixelSize) as number) * gridSnappingSensitivity
      ) {
        // Reverse grid offset
        let offsetSnapPoint = Vector2.add(
          Vector2.add(snapPoint, gridOffset),
          gridCellPixelOffset
        );
        return offsetSnapPoint;
      }
    }

    return position;
  }

  return snapPositionToGrid;
}

export default useGridSnapping;

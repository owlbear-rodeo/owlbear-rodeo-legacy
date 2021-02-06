import Konva from "konva";

import Vector2 from "../helpers/Vector2";
import { getCellLocation } from "../helpers/grid";

import { useGrid } from "../contexts/GridContext";

/**
 * Returns a function that when called will snap a node to the current grid
 * @param {number} snappingThreshold 1 = Always snap, 0 = never snap
 */
function useGridSnapping(snappingThreshold) {
  const { gridOffset, gridCellPixelSize } = useGrid();

  /**
   * @param {Konva.Node} node The node to snap
   */
  function snapNodeToGrid(node) {
    const position = node.position();
    const halfSize = Vector2.divide({ x: node.width(), y: node.height() }, 2);

    // Offsets to tranform the centered position into the four corners
    const cornerOffsets = [
      { x: 0, y: 0 },
      // halfSize,
      // { x: -halfSize.x, y: -halfSize.y },
      // { x: halfSize.x, y: -halfSize.y },
      // { x: -halfSize.x, y: halfSize.y },
    ];

    // Minimum distance from a corner to the grid
    let minCornerGridDistance = Number.MAX_VALUE;
    // Minimum component of the difference between the min corner and the grid
    let minCornerMinComponent;
    // Closest grid value
    let minGridSnap;

    // Find the closest corner to the grid
    for (let cornerOffset of cornerOffsets) {
      const corner = Vector2.add(position, cornerOffset);
      // Transform into gridOffset space, round, then transform back
      const gridSnap = Vector2.add(
        Vector2.roundTo(
          Vector2.subtract(corner, gridOffset),
          gridCellPixelSize
        ),
        gridOffset
      );
      const gridDistance = Vector2.length(Vector2.subtract(gridSnap, corner));
      const minComponent = Vector2.min(gridCellPixelSize);
      if (gridDistance < minCornerGridDistance) {
        minCornerGridDistance = gridDistance;
        minCornerMinComponent = minComponent;
        // Move the grid value back to the center
        minGridSnap = Vector2.subtract(gridSnap, cornerOffset);
      }
    }

    // Snap to center of grid
    // Subtract gridOffset and half grid size to transform it into gridOffset half space then transform it back
    const halfGridSize = Vector2.multiply(gridCellPixelSize, 0.5);
    const centerSnap = Vector2.add(
      Vector2.add(
        Vector2.roundTo(
          Vector2.subtract(
            Vector2.subtract(position, gridOffset),
            halfGridSize
          ),
          gridCellPixelSize
        ),
        halfGridSize
      ),
      gridOffset
    );
    const centerDistance = Vector2.length(
      Vector2.subtract(centerSnap, position)
    );

    if (minCornerGridDistance < minCornerMinComponent * snappingThreshold) {
      node.position(minGridSnap);
    } else if (
      centerDistance <
      Vector2.min(gridCellPixelSize) * snappingThreshold
    ) {
      node.position(centerSnap);
    }
  }

  return snapNodeToGrid;
}

export default useGridSnapping;

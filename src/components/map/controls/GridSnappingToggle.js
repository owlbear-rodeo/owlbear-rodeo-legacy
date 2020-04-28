import React from "react";
import { IconButton } from "theme-ui";

import GridOnIcon from "../../../icons/GridOnIcon";
import GridOffIcon from "../../../icons/GridOffIcon";

function GridSnappingToggle({ useGridSnapping, onGridSnappingChange }) {
  return (
    <IconButton
      aria-label={
        useGridSnapping ? "Disable Grid Snapping" : "Enable Grid Snapping"
      }
      title={useGridSnapping ? "Disable Grid Snapping" : "Enable Grid Snapping"}
      onClick={() => onGridSnappingChange(!useGridSnapping)}
    >
      {useGridSnapping ? <GridOnIcon /> : <GridOffIcon />}
    </IconButton>
  );
}

export default GridSnappingToggle;

import React from "react";
import { IconButton } from "theme-ui";

import SnappingOnIcon from "../../../icons/SnappingOnIcon";
import SnappingOffIcon from "../../../icons/SnappingOffIcon";

function EdgeSnappingToggle({ useEdgeSnapping, onEdgeSnappingChange }) {
  return (
    <IconButton
      aria-label={
        useEdgeSnapping ? "Disable Edge Snapping" : "Enable Edge Snapping"
      }
      title={useEdgeSnapping ? "Disable Edge Snapping" : "Enable Edge Snapping"}
      onClick={() => onEdgeSnappingChange(!useEdgeSnapping)}
    >
      {useEdgeSnapping ? <SnappingOnIcon /> : <SnappingOffIcon />}
    </IconButton>
  );
}

export default EdgeSnappingToggle;

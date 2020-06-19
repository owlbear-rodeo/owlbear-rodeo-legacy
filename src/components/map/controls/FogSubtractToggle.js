import React from "react";
import { IconButton } from "theme-ui";

import FogAddIcon from "../../../icons/FogAddIcon";
import FogSubtractIcon from "../../../icons/FogSubtractIcon";

function FogSubtractToggle({ useFogSubtract, onFogSubtractChange }) {
  return (
    <IconButton
      aria-label={useFogSubtract ? "Add Fog" : "Subtract Fog"}
      title={useFogSubtract ? "Add Fog" : "Subtract Fog"}
      onClick={() => onFogSubtractChange(!useFogSubtract)}
    >
      {useFogSubtract ? <FogSubtractIcon /> : <FogAddIcon />}
    </IconButton>
  );
}

export default FogSubtractToggle;

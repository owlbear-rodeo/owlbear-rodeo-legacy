import React from "react";
import { IconButton } from "theme-ui";

import BlendOnIcon from "../../../icons/BlendOnIcon";
import BlendOffIcon from "../../../icons/BlendOffIcon";

function AlphaBlendToggle({ useBlending, onBlendingChange }) {
  return (
    <IconButton
      aria-label={useBlending ? "Disable Blending" : "Enable Blending"}
      title={useBlending ? "Disable Blending" : "Enable Blending"}
      onClick={() => onBlendingChange(!useBlending)}
    >
      {useBlending ? <BlendOnIcon /> : <BlendOffIcon />}
    </IconButton>
  );
}

export default AlphaBlendToggle;

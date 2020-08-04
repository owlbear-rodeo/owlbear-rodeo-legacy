import React from "react";
import { IconButton } from "theme-ui";

import PreviewOnIcon from "../../../icons/FogPreviewOnIcon";
import PreviewOffIcon from "../../../icons/FogPreviewOffIcon";

function FogPreviewToggle({ useFogPreview, onFogPreviewChange }) {
  return (
    <IconButton
      aria-label={useFogPreview ? "Disable Fog Preview" : "Enable Fog Preview"}
      title={useFogPreview ? "Disable Fog Preview" : "Enable Fog Preview"}
      onClick={() => onFogPreviewChange(!useFogPreview)}
    >
      {useFogPreview ? <PreviewOnIcon /> : <PreviewOffIcon />}
    </IconButton>
  );
}

export default FogPreviewToggle;

import React from "react";
import { IconButton } from "theme-ui";

import PreviewOnIcon from "../../../icons/FogPreviewOnIcon";
import PreviewOffIcon from "../../../icons/FogPreviewOffIcon";

function FogPreviewToggle({ useFogPreview, onFogPreviewChange }) {
  return (
    <IconButton
      aria-label={
        useFogPreview ? "Disable Fog Preview (F)" : "Enable Fog Preview (F)"
      }
      title={
        useFogPreview ? "Disable Fog Preview (F)" : "Enable Fog Preview (F)"
      }
      onClick={() => onFogPreviewChange(!useFogPreview)}
    >
      {useFogPreview ? <PreviewOnIcon /> : <PreviewOffIcon />}
    </IconButton>
  );
}

export default FogPreviewToggle;

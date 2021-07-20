import { IconButton } from "theme-ui";

import CutOnIcon from "../../../icons/FogCutOnIcon";
import CutOffIcon from "../../../icons/FogCutOffIcon";

type FogCutToggleProps = {
  useFogCut: boolean;
  onFogCutChange: (useFogCut: boolean) => void;
  disabled?: boolean;
};

function FogCutToggle({
  useFogCut,
  onFogCutChange,
  disabled,
}: FogCutToggleProps) {
  return (
    <IconButton
      aria-label={
        useFogCut ? "Disable Fog Cutting (C)" : "Enable Fog Cutting (C)"
      }
      title={useFogCut ? "Disable Fog Cutting (C)" : "Enable Fog Cutting (C)"}
      onClick={() => onFogCutChange(!useFogCut)}
      disabled={disabled}
    >
      {useFogCut ? <CutOnIcon /> : <CutOffIcon />}
    </IconButton>
  );
}

export default FogCutToggle;

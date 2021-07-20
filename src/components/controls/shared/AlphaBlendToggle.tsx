import { IconButton } from "theme-ui";

import BlendOnIcon from "../../../icons/BlendOnIcon";
import BlendOffIcon from "../../../icons/BlendOffIcon";

type AlphaBlendToggleProps = {
  useBlending: boolean;
  onBlendingChange: (useBlending: boolean) => void;
};

function AlphaBlendToggle({
  useBlending,
  onBlendingChange,
}: AlphaBlendToggleProps) {
  return (
    <IconButton
      aria-label={useBlending ? "Disable Blending (O)" : "Enable Blending (O)"}
      title={useBlending ? "Disable Blending (O)" : "Enable Blending (O)"}
      onClick={() => onBlendingChange(!useBlending)}
    >
      {useBlending ? <BlendOnIcon /> : <BlendOffIcon />}
    </IconButton>
  );
}

export default AlphaBlendToggle;

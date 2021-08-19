import { IconButton } from "theme-ui";

import ShapeFillOnIcon from "../../../icons/ShapeFillOnIcon";
import ShapeFillOffIcon from "../../../icons/ShapeFillOffIcon";

type ShapeFillToggleProps = {
  useShapeFill: boolean;
  onShapeFillChange: (useShapeFill: boolean) => void;
};

function ShapeFillToggle({
  useShapeFill,
  onShapeFillChange,
}: ShapeFillToggleProps) {
  return (
    <IconButton
      aria-label={
        useShapeFill ? "Disable Shape Fill (G)" : "Enable Shape Fill (G)"
      }
      title={useShapeFill ? "Disable Shape Fill (G)" : "Enable Shape Fill (G)"}
      onClick={() => onShapeFillChange(!useShapeFill)}
    >
      {useShapeFill ? <ShapeFillOnIcon /> : <ShapeFillOffIcon />}
    </IconButton>
  );
}

export default ShapeFillToggle;

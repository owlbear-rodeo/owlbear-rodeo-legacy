import React from "react";
import { Flex } from "theme-ui";

import EdgeSnappingToggle from "./EdgeSnappingToggle";
import RadioIconButton from "./RadioIconButton";
import FogSubtractToggle from "./FogSubtractToggle";

import FogBrushIcon from "../../../icons/FogBrushIcon";
import FogPolygonIcon from "../../../icons/FogPolygonIcon";
import FogRemoveIcon from "../../../icons/FogRemoveIcon";
import FogToggleIcon from "../../../icons/FogToggleIcon";

import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";

import Divider from "../../Divider";

function BrushToolSettings({
  settings,
  onSettingChange,
  onToolAction,
  disabledActions,
}) {
  return (
    <Flex sx={{ alignItems: "center" }}>
      <RadioIconButton
        title="Fog Polygon"
        onClick={() => onSettingChange({ type: "polygon" })}
        isSelected={settings.type === "polygon"}
      >
        <FogPolygonIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Fog Brush"
        onClick={() => onSettingChange({ type: "brush" })}
        isSelected={settings.type === "brush"}
      >
        <FogBrushIcon />
      </RadioIconButton>
      <Divider vertical />
      <FogSubtractToggle
        useFogSubtract={settings.useFogSubtract}
        onFogSubtractChange={(useFogSubtract) =>
          onSettingChange({ useFogSubtract })
        }
      />
      {/* TODO: Re-enable edge snapping when holes are fixed */}
      {/* <EdgeSnappingToggle
        useEdgeSnapping={settings.useEdgeSnapping}
        onEdgeSnappingChange={(useEdgeSnapping) =>
          onSettingChange({ useEdgeSnapping })
        }
      /> */}
      <Divider vertical />
      <RadioIconButton
        title="Toggle Fog"
        onClick={() => onSettingChange({ type: "toggle" })}
        isSelected={settings.type === "toggle"}
      >
        <FogToggleIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Remove Fog"
        onClick={() => onSettingChange({ type: "remove" })}
        isSelected={settings.type === "remove"}
      >
        <FogRemoveIcon />
      </RadioIconButton>
      <Divider vertical />
      <UndoButton
        onClick={() => onToolAction("fogUndo")}
        disabled={disabledActions.includes("undo")}
      />
      <RedoButton
        onClick={() => onToolAction("fogRedo")}
        disabled={disabledActions.includes("redo")}
      />
    </Flex>
  );
}

export default BrushToolSettings;

import React from "react";
import { Flex } from "theme-ui";

import ColorControl from "./ColorControl";
import AlphaBlendToggle from "./AlphaBlendToggle";
import GridSnappingToggle from "./GridSnappingToggle";
import RadioIconButton from "./RadioIconButton";

import BrushStrokeIcon from "../../../icons/BrushStrokeIcon";
import BrushFillIcon from "../../../icons/BrushFillIcon";

import Divider from "./Divider";

function BrushToolSettings({ settings, onSettingChange }) {
  return (
    <Flex sx={{ alignItems: "center" }}>
      <ColorControl
        color={settings.color}
        onColorChange={(color) => onSettingChange({ color })}
      />
      <Divider vertical />
      <RadioIconButton
        title="Brush Type Stroke"
        onClick={() => onSettingChange({ type: "stroke" })}
        isSelected={settings.type === "stroke"}
      >
        <BrushStrokeIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Brush Type Fill"
        onClick={() => onSettingChange({ type: "fill" })}
        isSelected={settings.type === "fill"}
      >
        <BrushFillIcon />
      </RadioIconButton>
      <Divider vertical />
      <AlphaBlendToggle
        useBlending={settings.useBlending}
        onBlendingChange={(useBlending) => onSettingChange({ useBlending })}
      />
      <GridSnappingToggle
        useGridSnapping={settings.useGridSnapping}
        onGridSnappingChange={(useGridSnapping) =>
          onSettingChange({ useGridSnapping })
        }
      />
    </Flex>
  );
}

export default BrushToolSettings;

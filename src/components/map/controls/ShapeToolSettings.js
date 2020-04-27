import React from "react";
import { Flex } from "theme-ui";

import ColorControl from "./ColorControl";
import AlphaBlendToggle from "./AlphaBlendToggle";
import GridSnappingToggle from "./GridSnappingToggle";
import RadioIconButton from "./RadioIconButton";

import ShapeRectangleIcon from "../../../icons/ShapeRectangleIcon";
import ShapeCircleIcon from "../../../icons/ShapeCircleIcon";
import ShapeTriangleIcon from "../../../icons/ShapeTriangleIcon";

import Divider from "./Divider";

function ShapeToolSettings({ settings, onSettingChange }) {
  return (
    <Flex sx={{ alignItems: "center" }}>
      <ColorControl
        color={settings.color}
        onColorChange={(color) => onSettingChange({ color })}
      />
      <Divider vertical />
      <RadioIconButton
        title="Shape Type Rectangle"
        onClick={() => onSettingChange({ type: "rectangle" })}
        isSelected={settings.type === "rectangle"}
      >
        <ShapeRectangleIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Shape Type Circle"
        onClick={() => onSettingChange({ type: "circle" })}
        isSelected={settings.type === "circle"}
      >
        <ShapeCircleIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Shape Type Triangle"
        onClick={() => onSettingChange({ type: "triangle" })}
        isSelected={settings.type === "triangle"}
      >
        <ShapeTriangleIcon />
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

export default ShapeToolSettings;

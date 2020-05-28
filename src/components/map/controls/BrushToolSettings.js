import React from "react";
import { Flex } from "theme-ui";

import ColorControl from "./ColorControl";
import AlphaBlendToggle from "./AlphaBlendToggle";
import RadioIconButton from "./RadioIconButton";

import BrushStrokeIcon from "../../../icons/BrushStrokeIcon";
import BrushFillIcon from "../../../icons/BrushFillIcon";

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
      <Divider vertical />
      <UndoButton
        onClick={() => onToolAction("mapUndo")}
        disabled={disabledActions.includes("undo")}
      />
      <RedoButton
        onClick={() => onToolAction("mapRedo")}
        disabled={disabledActions.includes("redo")}
      />
    </Flex>
  );
}

export default BrushToolSettings;

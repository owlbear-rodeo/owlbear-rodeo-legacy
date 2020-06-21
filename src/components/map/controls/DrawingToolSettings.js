import React from "react";
import { Flex, IconButton } from "theme-ui";

import ColorControl from "./ColorControl";
import AlphaBlendToggle from "./AlphaBlendToggle";
import RadioIconButton from "./RadioIconButton";

import BrushIcon from "../../../icons/BrushToolIcon";
import BrushFillIcon from "../../../icons/BrushPaintIcon";
import BrushRectangleIcon from "../../../icons/BrushRectangleIcon";
import BrushCircleIcon from "../../../icons/BrushCircleIcon";
import BrushTriangleIcon from "../../../icons/BrushTriangleIcon";
import EraseAllIcon from "../../../icons/EraseAllIcon";
import EraseIcon from "../../../icons/EraseToolIcon";

import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";

import Divider from "../../Divider";

function DrawingToolSettings({
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
        title="Brush"
        onClick={() => onSettingChange({ type: "brush" })}
        isSelected={settings.type === "brush"}
      >
        <BrushIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Paint"
        onClick={() => onSettingChange({ type: "paint" })}
        isSelected={settings.type === "paint"}
      >
        <BrushFillIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Rectangle"
        onClick={() => onSettingChange({ type: "rectangle" })}
        isSelected={settings.type === "rectangle"}
      >
        <BrushRectangleIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Circle"
        onClick={() => onSettingChange({ type: "circle" })}
        isSelected={settings.type === "circle"}
      >
        <BrushCircleIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Triangle"
        onClick={() => onSettingChange({ type: "triangle" })}
        isSelected={settings.type === "triangle"}
      >
        <BrushTriangleIcon />
      </RadioIconButton>
      <Divider vertical />
      <RadioIconButton
        title="Erase"
        onClick={() => onSettingChange({ type: "erase" })}
        isSelected={settings.type === "erase"}
        disabled={disabledActions.includes("erase")}
      >
        <EraseIcon />
      </RadioIconButton>
      <IconButton
        aria-label="Erase All"
        title="Erase All"
        onClick={() => onToolAction("eraseAll")}
        disabled={disabledActions.includes("erase")}
      >
        <EraseAllIcon />
      </IconButton>
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

export default DrawingToolSettings;

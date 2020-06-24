import React, { useEffect, useContext } from "react";
import { Flex, IconButton } from "theme-ui";

import ColorControl from "./ColorControl";
import AlphaBlendToggle from "./AlphaBlendToggle";
import RadioIconButton from "./RadioIconButton";

import BrushIcon from "../../../icons/BrushToolIcon";
import BrushPaintIcon from "../../../icons/BrushPaintIcon";
import BrushLineIcon from "../../../icons/BrushLineIcon";
import BrushRectangleIcon from "../../../icons/BrushRectangleIcon";
import BrushCircleIcon from "../../../icons/BrushCircleIcon";
import BrushTriangleIcon from "../../../icons/BrushTriangleIcon";
import EraseAllIcon from "../../../icons/EraseAllIcon";
import EraseIcon from "../../../icons/EraseToolIcon";

import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";

import Divider from "../../Divider";

import MapInteractionContext from "../../../contexts/MapInteractionContext";

function DrawingToolSettings({
  settings,
  onSettingChange,
  onToolAction,
  disabledActions,
}) {
  const { interactionEmitter } = useContext(MapInteractionContext);

  // Keyboard shotcuts
  useEffect(() => {
    function handleKeyDown({ key, ctrlKey, metaKey, shiftKey }) {
      if (key === "b") {
        onSettingChange({ type: "brush" });
      } else if (key === "p") {
        onSettingChange({ type: "paint" });
      } else if (key === "l") {
        onSettingChange({ type: "line" });
      } else if (key === "r") {
        onSettingChange({ type: "rectangle" });
      } else if (key === "c") {
        onSettingChange({ type: "circle" });
      } else if (key === "t") {
        onSettingChange({ type: "triangle" });
      } else if (key === "e") {
        onSettingChange({ type: "erase" });
      } else if (key === "o") {
        onSettingChange({ useBlending: !settings.useBlending });
      } else if (
        key === "z" &&
        (ctrlKey || metaKey) &&
        shiftKey &&
        !disabledActions.includes("redo")
      ) {
        onToolAction("mapRedo");
      } else if (
        key === "z" &&
        (ctrlKey || metaKey) &&
        !shiftKey &&
        !disabledActions.includes("undo")
      ) {
        onToolAction("mapUndo");
      }
    }

    interactionEmitter.on("keyDown", handleKeyDown);
    return () => {
      interactionEmitter.off("keyDown", handleKeyDown);
    };
  });

  // Change to brush if on erase and it gets disabled
  useEffect(() => {
    if (settings.type === "erase" && disabledActions.includes("erase")) {
      onSettingChange({ type: "brush" });
    }
  }, [disabledActions, settings, onSettingChange]);

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
        <BrushPaintIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Line"
        onClick={() => onSettingChange({ type: "line" })}
        isSelected={settings.type === "line"}
      >
        <BrushLineIcon />
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

import React, { useEffect } from "react";
import { Flex, IconButton } from "theme-ui";
import { useMedia } from "react-media";

import ColorControl from "./ColorControl";
import AlphaBlendToggle from "./AlphaBlendToggle";
import RadioIconButton from "./RadioIconButton";
import ToolSection from "./ToolSection";

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

import useKeyboard from "../../../helpers/useKeyboard";

function DrawingToolSettings({
  settings,
  onSettingChange,
  onToolAction,
  disabledActions,
}) {
  // Keyboard shotcuts
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
      (key === "z" || key === "Z") &&
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
  useKeyboard(handleKeyDown);

  // Change to brush if on erase and it gets disabled
  useEffect(() => {
    if (settings.type === "erase" && disabledActions.includes("erase")) {
      onSettingChange({ type: "brush" });
    }
  }, [disabledActions, settings, onSettingChange]);

  const isSmallScreen = useMedia({ query: "(max-width: 799px)" });

  const tools = [
    {
      id: "brush",
      title: "Brush",
      isSelected: settings.type === "brush",
      icon: <BrushIcon />,
    },
    {
      id: "paint",
      title: "Paint",
      isSelected: settings.type === "paint",
      icon: <BrushPaintIcon />,
    },
    {
      id: "line",
      title: "Line",
      isSelected: settings.type === "line",
      icon: <BrushLineIcon />,
    },
    {
      id: "rectangle",
      title: "Rectangle",
      isSelected: settings.type === "rectangle",
      icon: <BrushRectangleIcon />,
    },
    {
      id: "circle",
      title: "Circle",
      isSelected: settings.type === "circle",
      icon: <BrushCircleIcon />,
    },
    {
      id: "triangle",
      title: "Triangle",
      isSelected: settings.type === "triangle",
      icon: <BrushTriangleIcon />,
    },
  ];

  return (
    <Flex sx={{ alignItems: "center" }}>
      <ColorControl
        color={settings.color}
        onColorChange={(color) => onSettingChange({ color })}
      />
      <Divider vertical />
      <ToolSection
        tools={tools}
        onToolClick={(tool) => onSettingChange({ type: tool.id })}
        collapse={isSmallScreen}
      />
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

import React from "react";
import { Flex } from "theme-ui";
import { useMedia } from "react-media";

import RadioIconButton from "../../RadioIconButton";

import MultilayerToggle from "./MultilayerToggle";
import FogPreviewToggle from "./FogPreviewToggle";
import FogCutToggle from "./FogCutToggle";

import FogBrushIcon from "../../../icons/FogBrushIcon";
import FogPolygonIcon from "../../../icons/FogPolygonIcon";
import FogRemoveIcon from "../../../icons/FogRemoveIcon";
import FogToggleIcon from "../../../icons/FogToggleIcon";
import FogRectangleIcon from "../../../icons/FogRectangleIcon";

import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";
import ToolSection from "./ToolSection";

import Divider from "../../Divider";

import { useKeyboard } from "../../../contexts/KeyboardContext";

function BrushToolSettings({
  settings,
  onSettingChange,
  onToolAction,
  disabledActions,
}) {
  // Keyboard shortcuts
  function handleKeyDown({ key, ctrlKey, metaKey, shiftKey }) {
    if (key === "p") {
      onSettingChange({ type: "polygon" });
    } else if (key === "b") {
      onSettingChange({ type: "brush" });
    } else if (key === "t") {
      onSettingChange({ type: "toggle" });
    } else if (key === "e") {
      onSettingChange({ type: "remove" });
    } else if (key === "l") {
      onSettingChange({ multilayer: !settings.multilayer });
    } else if (key === "f") {
      onSettingChange({ preview: !settings.preview });
    } else if (key === "c") {
      onSettingChange({ useFogCut: !settings.useFogCut });
    } else if (key === "r") {
      onSettingChange({ type: "rectangle" });
    } else if (
      (key === "z" || key === "Z") &&
      (ctrlKey || metaKey) &&
      shiftKey &&
      !disabledActions.includes("redo")
    ) {
      onToolAction("fogRedo");
    } else if (
      key === "z" &&
      (ctrlKey || metaKey) &&
      !shiftKey &&
      !disabledActions.includes("undo")
    ) {
      onToolAction("fogUndo");
    }
  }

  useKeyboard(handleKeyDown);

  const isSmallScreen = useMedia({ query: "(max-width: 799px)" });
  const drawTools = [
    {
      id: "polygon",
      title: "Fog Polygon (P)",
      isSelected: settings.type === "polygon",
      icon: <FogPolygonIcon />,
      disabled: settings.preview,
    },
    {
      id: "rectangle",
      title: "Fog Rectangle (R)",
      isSelected: settings.type === "rectangle",
      icon: <FogRectangleIcon />,
      disabled: settings.preview,
    },
    {
      id: "brush",
      title: "Fog Brush (B)",
      isSelected: settings.type === "brush",
      icon: <FogBrushIcon />,
      disabled: settings.preview,
    },
  ];

  return (
    <Flex sx={{ alignItems: "center" }}>
      <ToolSection
        tools={drawTools}
        onToolClick={(tool) => onSettingChange({ type: tool.id })}
        collapse={isSmallScreen}
      />
      <Divider vertical />
      <RadioIconButton
        title="Toggle Fog (T)"
        onClick={() => onSettingChange({ type: "toggle" })}
        isSelected={settings.type === "toggle"}
        disabled={settings.preview}
      >
        <FogToggleIcon />
      </RadioIconButton>
      <RadioIconButton
        title="Erase Fog (E)"
        onClick={() => onSettingChange({ type: "remove" })}
        isSelected={settings.type === "remove"}
        disabled={settings.preview}
      >
        <FogRemoveIcon />
      </RadioIconButton>
      <Divider vertical />
      <FogCutToggle
        useFogCut={settings.useFogCut}
        onFogCutChange={(useFogCut) => onSettingChange({ useFogCut })}
        disabled={settings.preview}
      />
      <MultilayerToggle
        multilayer={settings.multilayer}
        onMultilayerChange={(multilayer) => onSettingChange({ multilayer })}
        disabled={settings.preview}
      />
      <FogPreviewToggle
        useFogPreview={settings.preview}
        onFogPreviewChange={(preview) => onSettingChange({ preview })}
      />
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

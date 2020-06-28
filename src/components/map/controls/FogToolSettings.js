import React, { useContext, useEffect } from "react";
import { Flex } from "theme-ui";
import { useMedia } from "react-media";

import EdgeSnappingToggle from "./EdgeSnappingToggle";
import RadioIconButton from "./RadioIconButton";

import FogBrushIcon from "../../../icons/FogBrushIcon";
import FogPolygonIcon from "../../../icons/FogPolygonIcon";
import FogRemoveIcon from "../../../icons/FogRemoveIcon";
import FogToggleIcon from "../../../icons/FogToggleIcon";
import FogAddIcon from "../../../icons/FogAddIcon";
import FogSubtractIcon from "../../../icons/FogSubtractIcon";

import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";

import Divider from "../../Divider";

import MapInteractionContext from "../../../contexts/MapInteractionContext";
import ToolSection from "./ToolSection";

function BrushToolSettings({
  settings,
  onSettingChange,
  onToolAction,
  disabledActions,
}) {
  const { interactionEmitter } = useContext(MapInteractionContext);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown({ key, ctrlKey, metaKey, shiftKey }) {
      if (key === "Alt") {
        onSettingChange({ useFogSubtract: !settings.useFogSubtract });
      } else if (key === "p") {
        onSettingChange({ type: "polygon" });
      } else if (key === "b") {
        onSettingChange({ type: "brush" });
      } else if (key === "t") {
        onSettingChange({ type: "toggle" });
      } else if (key === "r") {
        onSettingChange({ type: "remove" });
      } else if (key === "s") {
        onSettingChange({ useEdgeSnapping: !settings.useEdgeSnapping });
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

    function handleKeyUp({ key }) {
      if (key === "Alt") {
        onSettingChange({ useFogSubtract: !settings.useFogSubtract });
      }
    }

    interactionEmitter.on("keyDown", handleKeyDown);
    interactionEmitter.on("keyUp", handleKeyUp);
    return () => {
      interactionEmitter.off("keyDown", handleKeyDown);
      interactionEmitter.off("keyUp", handleKeyUp);
    };
  });

  const isSmallScreen = useMedia({ query: "(max-width: 799px)" });
  const drawTools = [
    {
      id: "polygon",
      title: "Fog Polygon",
      isSelected: settings.type === "polygon",
      icon: <FogPolygonIcon />,
    },
    {
      id: "brush",
      title: "Fog Brush",
      isSelected: settings.type === "brush",
      icon: <FogBrushIcon />,
    },
  ];

  const modeTools = [
    {
      id: "add",
      title: "Add Fog",
      isSelected: !settings.useFogSubtract,
      icon: <FogAddIcon />,
    },
    {
      id: "subtract",
      title: "Subtracy Fog",
      isSelected: settings.useFogSubtract,
      icon: <FogSubtractIcon />,
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
      <ToolSection
        tools={modeTools}
        onToolClick={(tool) =>
          onSettingChange({ useFogSubtract: tool.id === "subtract" })
        }
        collapse={isSmallScreen}
      />
      <Divider vertical />
      <EdgeSnappingToggle
        useEdgeSnapping={settings.useEdgeSnapping}
        onEdgeSnappingChange={(useEdgeSnapping) =>
          onSettingChange({ useEdgeSnapping })
        }
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

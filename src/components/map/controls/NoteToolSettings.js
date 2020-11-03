import React from "react";
import { Flex } from "theme-ui";

import ToolSection from "./ToolSection";
import NoteAddIcon from "../../../icons/NoteAddIcon";
import MoveIcon from "../../../icons/MoveIcon";

import useKeyboard from "../../../helpers/useKeyboard";

function NoteToolSettings({ settings, onSettingChange }) {
  // Keyboard shortcuts
  function handleKeyDown({ key }) {
    if (key === "a") {
      onSettingChange({ type: "add" });
    } else if (key === "v") {
      onSettingChange({ type: "move" });
    }
  }

  useKeyboard(handleKeyDown);

  const tools = [
    {
      id: "add",
      title: "Add Note (A)",
      isSelected: settings.type === "add",
      icon: <NoteAddIcon />,
    },
    {
      id: "move",
      title: "Move Note (V)",
      isSelected: settings.type === "move",
      icon: <MoveIcon />,
    },
  ];

  return (
    <Flex sx={{ alignItems: "center" }}>
      <ToolSection
        tools={tools}
        onToolClick={(tool) => onSettingChange({ type: tool.id })}
      />
    </Flex>
  );
}

export default NoteToolSettings;

import React from "react";
import { Flex, Input, Text } from "theme-ui";

import ToolSection from "./ToolSection";
import MeasureChebyshevIcon from "../../../icons/MeasureChebyshevIcon";
import MeasureEuclideanIcon from "../../../icons/MeasureEuclideanIcon";
import MeasureManhattanIcon from "../../../icons/MeasureManhattanIcon";
import MeasureAlternatingIcon from "../../../icons/MeasureAlternatingIcon";

import Divider from "../../Divider";

import { useKeyboard } from "../../../contexts/KeyboardContext";

function MeasureToolSettings({ settings, onSettingChange }) {
  // Keyboard shortcuts
  function handleKeyDown({ key }) {
    if (key === "g") {
      onSettingChange({ type: "chebyshev" });
    } else if (key === "l") {
      onSettingChange({ type: "euclidean" });
    } else if (key === "c") {
      onSettingChange({ type: "manhattan" });
    } else if (key === "a") {
      onSettingChange({ type: "alternating" });
    }
  }

  useKeyboard(handleKeyDown);

  const tools = [
    {
      id: "chebyshev",
      title: "Grid Distance (G)",
      isSelected: settings.type === "chebyshev",
      icon: <MeasureChebyshevIcon />,
    },
    {
      id: "alternating",
      title: "Alternating Diagonal Distance (A)",
      isSelected: settings.type === "alternating",
      icon: <MeasureAlternatingIcon />,
    },
    {
      id: "euclidean",
      title: "Line Distance (L)",
      isSelected: settings.type === "euclidean",
      icon: <MeasureEuclideanIcon />,
    },
    {
      id: "manhattan",
      title: "City Block Distance (C)",
      isSelected: settings.type === "manhattan",
      icon: <MeasureManhattanIcon />,
    },
  ];

  return (
    <Flex sx={{ alignItems: "center" }}>
      <ToolSection
        tools={tools}
        onToolClick={(tool) => onSettingChange({ type: tool.id })}
      />
      <Divider vertical />
      <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
        Scale:
      </Text>
      <Input
        p={1}
        pl={0}
        sx={{
          width: "40px",
          border: "none",
          ":focus": {
            outline: "none",
          },
          lineHeight: 1.2,
        }}
        value={settings.scale}
        onChange={(e) => onSettingChange({ scale: e.target.value })}
        autoComplete="off"
      />
    </Flex>
  );
}

export default MeasureToolSettings;

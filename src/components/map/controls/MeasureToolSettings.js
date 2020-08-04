import React, { useEffect, useContext } from "react";
import { Flex, Input, Text } from "theme-ui";

import ToolSection from "./ToolSection";
import MeasureChebyshevIcon from "../../../icons/MeasureChebyshevIcon";
import MeasureEuclideanIcon from "../../../icons/MeasureEuclideanIcon";
import MeasureManhattanIcon from "../../../icons/MeasureManhattanIcon";

import Divider from "../../Divider";

import MapInteractionContext from "../../../contexts/MapInteractionContext";

function MeasureToolSettings({ settings, onSettingChange }) {
  const { interactionEmitter } = useContext(MapInteractionContext);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown({ key }) {
      if (key === "g") {
        onSettingChange({ type: "chebyshev" });
      } else if (key === "l") {
        onSettingChange({ type: "euclidean" });
      } else if (key === "c") {
        onSettingChange({ type: "manhattan" });
      }
    }
    interactionEmitter.on("keyDown", handleKeyDown);

    return () => {
      interactionEmitter.off("keyDown", handleKeyDown);
    };
  });

  const tools = [
    {
      id: "chebyshev",
      title: "Grid Distance",
      isSelected: settings.type === "chebyshev",
      icon: <MeasureChebyshevIcon />,
    },
    {
      id: "euclidean",
      title: "Line Distance",
      isSelected: settings.type === "euclidean",
      icon: <MeasureEuclideanIcon />,
    },
    {
      id: "manhattan",
      title: "City Block Distance",
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

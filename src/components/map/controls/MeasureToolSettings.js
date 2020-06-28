import React, { useEffect, useContext } from "react";
import { Flex } from "theme-ui";

import ToolSection from "./ToolSection";
import MeasureChebyshevIcon from "../../../icons/MeasureChebyshevIcon";
import MeasureEuclideanIcon from "../../../icons/MeasureEuclideanIcon";
import MeasureManhattanIcon from "../../../icons/MeasureManhattanIcon";

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

  // TODO Add keyboard shortcuts

  return (
    <Flex sx={{ alignItems: "center" }}>
      <ToolSection
        tools={tools}
        onToolClick={(tool) => onSettingChange({ type: tool.id })}
      />
    </Flex>
  );
}

export default MeasureToolSettings;

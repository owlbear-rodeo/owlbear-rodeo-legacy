import React from "react";
import { Flex } from "theme-ui";

import ToolSection from "./ToolSection";
import MeasureChebyshevIcon from "../../../icons/MeasureChebyshevIcon";
import MeasureEuclideanIcon from "../../../icons/MeasureEuclideanIcon";
import MeasureManhattanIcon from "../../../icons/MeasureManhattanIcon";

function MeasureToolSettings({ settings, onSettingChange }) {
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
    </Flex>
  );
}

export default MeasureToolSettings;

import React, { useState, Fragment } from "react";
import { IconButton, Flex, Box } from "theme-ui";

import RadioIconButton from "./controls/RadioIconButton";
import Divider from "../Divider";

import SelectMapButton from "./SelectMapButton";

import FogToolSettings from "./controls/FogToolSettings";
import DrawingToolSettings from "./controls/DrawingToolSettings";
import MeasureToolSettings from "./controls/MeasureToolSettings";

import PanToolIcon from "../../icons/PanToolIcon";
import FogToolIcon from "../../icons/FogToolIcon";
import BrushToolIcon from "../../icons/BrushToolIcon";
import MeasureToolIcon from "../../icons/MeasureToolIcon";
import ExpandMoreIcon from "../../icons/ExpandMoreIcon";
import PointerToolIcon from "../../icons/PointerToolIcon";

function MapContols({
  onMapChange,
  onMapStateChange,
  currentMap,
  currentMapState,
  selectedToolId,
  onSelectedToolChange,
  toolSettings,
  onToolSettingChange,
  onToolAction,
  disabledControls,
  disabledSettings,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toolsById = {
    pan: {
      id: "pan",
      icon: <PanToolIcon />,
      title: "Pan Tool",
    },
    fog: {
      id: "fog",
      icon: <FogToolIcon />,
      title: "Fog Tool",
      SettingsComponent: FogToolSettings,
    },
    drawing: {
      id: "drawing",
      icon: <BrushToolIcon />,
      title: "Drawing Tool",
      SettingsComponent: DrawingToolSettings,
    },
    measure: {
      id: "measure",
      icon: <MeasureToolIcon />,
      title: "Measure Tool",
      SettingsComponent: MeasureToolSettings,
    },
    pointer: {
      id: "pointer",
      icon: <PointerToolIcon />,
      title: "Pointer Tool",
    },
  };
  const tools = ["pan", "fog", "drawing", "measure", "pointer"];

  const sections = [
    {
      id: "map",
      component: (
        <SelectMapButton
          onMapChange={onMapChange}
          onMapStateChange={onMapStateChange}
          currentMap={currentMap}
          currentMapState={currentMapState}
          disabled={disabledControls.includes("map")}
        />
      ),
    },
    {
      id: "tools",
      component: tools.map((tool) => (
        <RadioIconButton
          key={tool}
          title={toolsById[tool].title}
          onClick={() => onSelectedToolChange(tool)}
          isSelected={selectedToolId === tool}
          disabled={disabledControls.includes(tool)}
        >
          {toolsById[tool].icon}
        </RadioIconButton>
      )),
    },
  ];

  let controls = null;
  if (sections.length === 1 && sections[0].id === "map") {
    controls = (
      <Box
        sx={{
          display: "block",
          backgroundColor: "overlay",
          borderRadius: "4px",
        }}
        m={2}
      >
        {sections[0].component}
      </Box>
    );
  } else if (sections.length > 0) {
    controls = (
      <>
        <IconButton
          aria-label={isExpanded ? "Hide Map Controls" : "Show Map Controls"}
          title={isExpanded ? "Hide Map Controls" : "Show Map Controls"}
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            transform: `rotate(${isExpanded ? "0" : "180deg"})`,
            display: "block",
            backgroundColor: "overlay",
            borderRadius: "50%",
          }}
          m={2}
        >
          <ExpandMoreIcon />
        </IconButton>
        <Box
          sx={{
            flexDirection: "column",
            alignItems: "center",
            display: isExpanded ? "flex" : "none",
            backgroundColor: "overlay",
            borderRadius: "4px",
          }}
          p={2}
        >
          {sections.map((section, index) => (
            <Fragment key={section.id}>
              {section.component}
              {index !== sections.length - 1 && <Divider />}
            </Fragment>
          ))}
        </Box>
      </>
    );
  }

  function getToolSettings() {
    const Settings = toolsById[selectedToolId].SettingsComponent;
    if (Settings) {
      return (
        <Box
          sx={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "overlay",
            borderRadius: "4px",
          }}
          p={1}
        >
          <Settings
            settings={toolSettings[selectedToolId]}
            onSettingChange={(change) =>
              onToolSettingChange(selectedToolId, change)
            }
            onToolAction={onToolAction}
            disabledActions={disabledSettings[selectedToolId]}
          />
        </Box>
      );
    } else {
      return null;
    }
  }

  return (
    <>
      <Flex
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          flexDirection: "column",
          alignItems: "center",
        }}
        mx={1}
      >
        {controls}
      </Flex>
      {getToolSettings()}
    </>
  );
}

export default MapContols;

import React, { useState, Fragment } from "react";
import { IconButton, Flex, Box } from "theme-ui";

import RadioIconButton from "../RadioIconButton";
import Divider from "../Divider";

import SelectMapButton from "./SelectMapButton";

import FogToolSettings from "./controls/FogToolSettings";
import DrawingToolSettings from "./controls/DrawingToolSettings";
import MeasureToolSettings from "./controls/MeasureToolSettings";
import NoteToolSettings from "./controls/NoteToolSettings";

import PanToolIcon from "../../icons/PanToolIcon";
import FogToolIcon from "../../icons/FogToolIcon";
import BrushToolIcon from "../../icons/BrushToolIcon";
import MeasureToolIcon from "../../icons/MeasureToolIcon";
import ExpandMoreIcon from "../../icons/ExpandMoreIcon";
import PointerToolIcon from "../../icons/PointerToolIcon";
import FullScreenIcon from "../../icons/FullScreenIcon";
import FullScreenExitIcon from "../../icons/FullScreenExitIcon";
import NoteToolIcon from "../../icons/NoteToolIcon";

import useSetting from "../../helpers/useSetting";

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
  const [fullScreen, setFullScreen] = useSetting("map.fullScreen");

  const toolsById = {
    pan: {
      id: "pan",
      icon: <PanToolIcon />,
      title: "Pan Tool (W)",
    },
    fog: {
      id: "fog",
      icon: <FogToolIcon />,
      title: "Fog Tool (F)",
      SettingsComponent: FogToolSettings,
    },
    drawing: {
      id: "drawing",
      icon: <BrushToolIcon />,
      title: "Drawing Tool (D)",
      SettingsComponent: DrawingToolSettings,
    },
    measure: {
      id: "measure",
      icon: <MeasureToolIcon />,
      title: "Measure Tool (M)",
      SettingsComponent: MeasureToolSettings,
    },
    pointer: {
      id: "pointer",
      icon: <PointerToolIcon />,
      title: "Pointer Tool (Q)",
    },
    note: {
      id: "note",
      icon: <NoteToolIcon />,
      title: "Note Tool (N)",
      SettingsComponent: NoteToolSettings,
    },
  };
  const tools = ["pan", "fog", "drawing", "measure", "pointer", "note"];

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
      <Box
        sx={{
          position: "absolute",
          right: "4px",
          bottom: 0,
          backgroundColor: "overlay",
          borderRadius: "50%",
        }}
        m={2}
      >
        <IconButton
          onClick={() => setFullScreen(!fullScreen)}
          aria-label={fullScreen ? "Exit Full Screen" : "Enter Full Screen"}
          title={fullScreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {fullScreen ? <FullScreenExitIcon /> : <FullScreenIcon />}
        </IconButton>
      </Box>
    </>
  );
}

export default MapContols;

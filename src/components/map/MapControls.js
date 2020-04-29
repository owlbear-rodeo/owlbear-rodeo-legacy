import React, { useState, Fragment, useEffect, useRef } from "react";
import { IconButton, Flex, Box } from "theme-ui";

import RadioIconButton from "./controls/RadioIconButton";
import Divider from "./controls/Divider";

import SelectMapButton from "./SelectMapButton";

import FogToolSettings from "./controls/FogToolSettings";
import BrushToolSettings from "./controls/BrushToolSettings";
import ShapeToolSettings from "./controls/ShapeToolSettings";
import EraseToolSettings from "./controls/EraseToolSettings";

import PanToolIcon from "../../icons/PanToolIcon";
import FogToolIcon from "../../icons/FogToolIcon";
import BrushToolIcon from "../../icons/BrushToolIcon";
import ShapeToolIcon from "../../icons/ShapeToolIcon";
import EraseToolIcon from "../../icons/EraseToolIcon";
import UndoIcon from "../../icons/UndoIcon";
import RedoIcon from "../../icons/RedoIcon";
import ExpandMoreIcon from "../../icons/ExpandMoreIcon";

function MapContols({
  onMapChange,
  onMapStateChange,
  currentMap,
  selectedToolId,
  onSelectedToolChange,
  toolSettings,
  onToolSettingChange,
  onToolAction,
  disabledControls,
  onUndo,
  onRedo,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

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
    brush: {
      id: "brush",
      icon: <BrushToolIcon />,
      title: "Brush Tool",
      SettingsComponent: BrushToolSettings,
    },
    shape: {
      id: "shape",
      icon: <ShapeToolIcon />,
      title: "Shape Tool",
      SettingsComponent: ShapeToolSettings,
    },
    erase: {
      id: "erase",
      icon: <EraseToolIcon />,
      title: "Erase tool",
      SettingsComponent: EraseToolSettings,
    },
  };
  const tools = ["pan", "fog", "brush", "shape", "erase"];

  const sections = [
    {
      id: "map",
      component: (
        <SelectMapButton
          onMapChange={onMapChange}
          onMapStateChange={onMapStateChange}
          currentMap={currentMap}
        />
      ),
    },
    {
      id: "drawing",
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
    {
      id: "history",
      component: (
        <>
          <IconButton
            onClick={onUndo}
            disabled={disabledControls.includes("undo")}
          >
            <UndoIcon />
          </IconButton>
          <IconButton
            onClick={onRedo}
            disabled={disabledControls.includes("redo")}
          >
            <RedoIcon />
          </IconButton>
        </>
      ),
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

  const controlsRef = useRef();
  const settingsRef = useRef();

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
          ref={settingsRef}
        >
          <Settings
            settings={toolSettings[selectedToolId]}
            onSettingChange={(change) =>
              onToolSettingChange(selectedToolId, change)
            }
            onToolAction={onToolAction}
          />
        </Box>
      );
    } else {
      return null;
    }
  }

  // Move back to pan tool if selected tool becomes disabled
  useEffect(() => {
    if (disabledControls.includes(selectedToolId)) {
      onSelectedToolChange("pan");
    }
  }, [disabledControls]);

  // Stop map drawing from happening when selecting controls
  // Not using react events as they seem to trigger after dom events
  useEffect(() => {
    function stopPropagation(e) {
      e.stopPropagation();
    }
    const controls = controlsRef.current;
    if (controls) {
      controls.addEventListener("mousedown", stopPropagation);
      controls.addEventListener("touchstart", stopPropagation);
    }
    const settings = settingsRef.current;
    if (settings) {
      settings.addEventListener("mousedown", stopPropagation);
      settings.addEventListener("touchstart", stopPropagation);
    }

    return () => {
      if (controls) {
        controls.removeEventListener("mousedown", stopPropagation);
        controls.removeEventListener("touchstart", stopPropagation);
      }
      if (settings) {
        settings.removeEventListener("mousedown", stopPropagation);
        settings.removeEventListener("touchstart", stopPropagation);
      }
    };
  });

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
        ref={controlsRef}
      >
        {controls}
      </Flex>
      {getToolSettings()}
    </>
  );
}

export default MapContols;

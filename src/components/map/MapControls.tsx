import { useState, Fragment } from "react";
import { IconButton, Flex, Box } from "theme-ui";

import RadioIconButton from "../RadioIconButton";
import Divider from "../Divider";

import SelectMapButton from "./SelectMapButton";

import FogToolSettings from "../controls/FogToolSettings";
import DrawingToolSettings from "../controls/DrawingToolSettings";
import PointerToolSettings from "../controls/PointerToolSettings";
import SelectToolSettings from "../controls/SelectToolSettings";

import MoveToolIcon from "../../icons/MoveToolIcon";
import FogToolIcon from "../../icons/FogToolIcon";
import BrushToolIcon from "../../icons/BrushToolIcon";
import MeasureToolIcon from "../../icons/MeasureToolIcon";
import ExpandMoreIcon from "../../icons/ExpandMoreIcon";
import PointerToolIcon from "../../icons/PointerToolIcon";
import FullScreenIcon from "../../icons/FullScreenIcon";
import FullScreenExitIcon from "../../icons/FullScreenExitIcon";
import NoteToolIcon from "../../icons/NoteToolIcon";
import SelectToolIcon from "../../icons/SelecToolIcon";

import UndoButton from "../controls/shared/UndoButton";
import RedoButton from "../controls/shared/RedoButton";

import useSetting from "../../hooks/useSetting";

import { Map, MapTool, MapToolId } from "../../types/Map";
import { MapState } from "../../types/MapState";
import {
  MapChangeEventHandler,
  MapResetEventHandler,
} from "../../types/Events";
import { Settings } from "../../types/Settings";

import { useKeyboard } from "../../contexts/KeyboardContext";

import shortcuts from "../../shortcuts";

type MapControlsProps = {
  onMapChange: MapChangeEventHandler;
  onMapReset: MapResetEventHandler;
  currentMap: Map | null;
  currentMapState: MapState | null;
  selectedToolId: MapToolId;
  onSelectedToolChange: (toolId: MapToolId) => void;
  toolSettings: Settings;
  onToolSettingChange: (change: Partial<Settings>) => void;
  onToolAction: (actionId: string) => void;
  disabledControls: MapToolId[];
  disabledSettings: Partial<Record<keyof Settings, string[]>>;
  onUndo: () => void;
  onRedo: () => void;
};

function MapContols({
  onMapChange,
  onMapReset,
  currentMap,
  currentMapState,
  selectedToolId,
  onSelectedToolChange,
  toolSettings,
  onToolSettingChange,
  onToolAction,
  disabledControls,
  disabledSettings,
  onUndo,
  onRedo,
}: MapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [fullScreen, setFullScreen] = useSetting("map.fullScreen");

  const toolsById: Record<string, MapTool> = {
    move: {
      id: "move",
      icon: <MoveToolIcon />,
      title: "Move Tool (W)",
    },
    select: {
      id: "select",
      icon: <SelectToolIcon />,
      title: "Select Tool (L)",
      SettingsComponent: SelectToolSettings,
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
    },
    pointer: {
      id: "pointer",
      icon: <PointerToolIcon />,
      title: "Pointer Tool (Q)",
      SettingsComponent: PointerToolSettings,
    },
    note: {
      id: "note",
      icon: <NoteToolIcon />,
      title: "Note Tool (N)",
    },
  };
  const tools: MapToolId[] = [
    "move",
    "select",
    "fog",
    "drawing",
    "measure",
    "pointer",
    "note",
  ];

  const sections = [
    {
      id: "map",
      component: (
        <SelectMapButton
          onMapChange={onMapChange}
          onMapReset={onMapReset}
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
    {
      id: "history",
      component: (
        <>
          <UndoButton onClick={onUndo} />
          <RedoButton onClick={onRedo} />
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

  function getToolSettings() {
    const Settings = toolsById[selectedToolId].SettingsComponent;
    if (
      !Settings ||
      selectedToolId === "move" ||
      selectedToolId === "measure" ||
      selectedToolId === "note"
    ) {
      return null;
    }
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
          onSettingChange={(
            change: Partial<Settings["fog" | "drawing" | "pointer" | "select"]>
          ) =>
            onToolSettingChange({
              [selectedToolId]: {
                ...toolSettings[selectedToolId],
                ...change,
              },
            })
          }
          onToolAction={onToolAction}
          disabledActions={disabledSettings[selectedToolId]}
        />
      </Box>
    );
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (shortcuts.moveTool(event) && !disabledControls.includes("move")) {
      onSelectedToolChange("move");
    }
    if (shortcuts.selectTool(event) && !disabledControls.includes("select")) {
      onSelectedToolChange("select");
    }
    if (shortcuts.drawingTool(event) && !disabledControls.includes("drawing")) {
      onSelectedToolChange("drawing");
    }
    if (shortcuts.fogTool(event) && !disabledControls.includes("fog")) {
      onSelectedToolChange("fog");
    }
    if (shortcuts.measureTool(event) && !disabledControls.includes("measure")) {
      onSelectedToolChange("measure");
    }
    if (shortcuts.pointerTool(event) && !disabledControls.includes("pointer")) {
      onSelectedToolChange("pointer");
    }
    if (shortcuts.noteTool(event) && !disabledControls.includes("note")) {
      onSelectedToolChange("note");
    }
  }

  useKeyboard(handleKeyDown);

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

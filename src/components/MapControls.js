import React, { useState } from "react";
import { Flex, Box, IconButton } from "theme-ui";

import AddMapButton from "./AddMapButton";
import ExpandMoreIcon from "../icons/ExpandMoreIcon";
import PanToolIcon from "../icons/PanToolIcon";
import BrushToolIcon from "../icons/BrushToolIcon";
import EraseToolIcon from "../icons/EraseToolIcon";
import UndoIcon from "../icons/UndoIcon";
import RedoIcon from "../icons/RedoIcon";

function MapControls({
  onMapChange,
  onToolChange,
  selectedTool,
  disabledTools,
  onUndo,
  onRedo,
  undoDisabled,
  redoDisabled,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const divider = (
    <Box
      my={2}
      bg="text"
      sx={{ height: "2px", width: "24px", borderRadius: "2px", opacity: 0.5 }}
    ></Box>
  );
  return (
    <Flex
      p={2}
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <IconButton
        aria-label={isExpanded ? "Hide Map Controls" : "Show Map Controls"}
        title={isExpanded ? "Hide Map Controls" : "Show Map Controls"}
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          transform: `rotate(${isExpanded ? "0" : "180deg"})`,
          display: "block",
        }}
      >
        <ExpandMoreIcon />
      </IconButton>
      <Box
        sx={{
          flexDirection: "column",
          alignItems: "center",
          display: isExpanded ? "flex" : "none",
        }}
      >
        <AddMapButton onMapChange={onMapChange} />
        {divider}
        <IconButton
          aria-label="Pan Tool"
          title="Pan Tool"
          onClick={() => onToolChange("pan")}
          sx={{ color: selectedTool === "pan" ? "primary" : "text" }}
          disabled={disabledTools.includes("pan")}
        >
          <PanToolIcon />
        </IconButton>
        <IconButton
          aria-label="Brush Tool"
          title="Brush Tool"
          onClick={() => onToolChange("brush")}
          sx={{ color: selectedTool === "brush" ? "primary" : "text" }}
          disabled={disabledTools.includes("brush")}
        >
          <BrushToolIcon />
        </IconButton>
        <IconButton
          aria-label="Erase Tool"
          title="Erase Tool"
          onClick={() => onToolChange("erase")}
          sx={{ color: selectedTool === "erase" ? "primary" : "text" }}
          disabled={disabledTools.includes("erase")}
        >
          <EraseToolIcon />
        </IconButton>
        {divider}
        <IconButton
          aria-label="Undo"
          title="Undo"
          onClick={() => onUndo()}
          disabled={undoDisabled}
        >
          <UndoIcon />
        </IconButton>
        <IconButton
          aria-label="Redo"
          title="Redo"
          onClick={() => onRedo()}
          disabled={redoDisabled}
        >
          <RedoIcon />
        </IconButton>
      </Box>
    </Flex>
  );
}

export default MapControls;

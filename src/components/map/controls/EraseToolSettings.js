import React from "react";
import { Flex, IconButton } from "theme-ui";

import EraseAllIcon from "../../../icons/EraseAllIcon";

import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";

import Divider from "./Divider";

function EraseToolSettings({ onToolAction, disabledActions }) {
  return (
    <Flex sx={{ alignItems: "center" }}>
      <IconButton
        aria-label="Erase All"
        title="Erase All"
        onClick={() => onToolAction("eraseAll")}
      >
        <EraseAllIcon />
      </IconButton>
      <Divider vertical />
      <UndoButton
        onClick={() => onToolAction("mapUndo")}
        disabled={disabledActions.includes("undo")}
      />
      <RedoButton
        onClick={() => onToolAction("mapRedo")}
        disabled={disabledActions.includes("redo")}
      />
    </Flex>
  );
}

export default EraseToolSettings;

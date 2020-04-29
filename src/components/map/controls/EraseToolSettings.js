import React from "react";
import { Flex, IconButton } from "theme-ui";

import EraseAllIcon from "../../../icons/EraseAllIcon";

function EraseToolSettings({ onToolAction }) {
  return (
    <Flex sx={{ alignItems: "center" }}>
      <IconButton
        aria-label="Erase All"
        title="Erase All"
        onClick={() => onToolAction("eraseAll")}
      >
        <EraseAllIcon />
      </IconButton>
    </Flex>
  );
}

export default EraseToolSettings;

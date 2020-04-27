import React from "react";
import { Flex, IconButton } from "theme-ui";

import EraseAllIcon from "../../../icons/EraseAllIcon";

function EraseToolSettings({ onEraseAll }) {
  return (
    <Flex sx={{ alignItems: "center" }}>
      <IconButton aria-label="Erase All" title="Erase All" onClick={onEraseAll}>
        <EraseAllIcon />
      </IconButton>
    </Flex>
  );
}

export default EraseToolSettings;

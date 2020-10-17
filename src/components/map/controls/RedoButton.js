import React from "react";
import { IconButton } from "theme-ui";

import RedoIcon from "../../../icons/RedoIcon";

import { isMacLike } from "../../../helpers/shared";

function RedoButton({ onClick, disabled }) {
  return (
    <IconButton
      title={`Redo (${isMacLike ? "Cmd" : "Ctrl"} + Shift + Z)`}
      aria-label={`Redo (${isMacLike ? "Cmd" : "Ctrl"} + Shift + Z)`}
      onClick={onClick}
      disabled={disabled}
    >
      <RedoIcon />
    </IconButton>
  );
}

export default RedoButton;

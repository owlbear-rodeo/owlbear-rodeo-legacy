import React from "react";
import { IconButton } from "theme-ui";

import UndoIcon from "../../../icons/UndoIcon";

import { isMacLike } from "../../../helpers/shared";

function UndoButton({ onClick, disabled }) {
  return (
    <IconButton
      title={`Undo (${isMacLike ? "Cmd" : "Ctrl"} + Z)`}
      aria-label={`Undo (${isMacLike ? "Cmd" : "Ctrl"} + Z)`}
      onClick={onClick}
      disabled={disabled}
    >
      <UndoIcon />
    </IconButton>
  );
}

export default UndoButton;

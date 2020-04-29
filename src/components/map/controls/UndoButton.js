import React from "react";
import { IconButton } from "theme-ui";

import UndoIcon from "../../../icons/UndoIcon";

function UndoButton({ onClick, disabled }) {
  return (
    <IconButton onClick={onClick} disabled={disabled}>
      <UndoIcon />
    </IconButton>
  );
}

export default UndoButton;

import React from "react";
import { IconButton } from "theme-ui";

import RedoIcon from "../../../icons/RedoIcon";

function RedoButton({ onClick, disabled }) {
  return (
    <IconButton onClick={onClick} disabled={disabled}>
      <RedoIcon />
    </IconButton>
  );
}

export default RedoButton;

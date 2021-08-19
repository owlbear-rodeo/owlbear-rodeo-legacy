import React from "react";
import { IconButton } from "theme-ui";

import UndoIcon from "../../../icons/UndoIcon";

import { isMacLike } from "../../../helpers/shared";

type UndoButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
};

function UndoButton({ onClick, disabled }: UndoButtonProps) {
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

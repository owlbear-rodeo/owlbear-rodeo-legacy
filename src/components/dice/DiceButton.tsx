import React from "react";
import { IconButton } from "theme-ui";

import Count from "./DiceButtonCount";

type DiceButtonProps = {
  title: string;
  children: React.ReactNode;
  count?: number;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled: boolean;
};

function DiceButton({
  title,
  children,
  count,
  onClick,
  disabled,
}: DiceButtonProps) {
  return (
    <IconButton
      title={title}
      aria-label={title}
      onClick={onClick}
      sx={{ position: "relative" }}
      disabled={disabled}
    >
      {children}
      {count && <Count>{count}</Count>}
    </IconButton>
  );
}

export default DiceButton;

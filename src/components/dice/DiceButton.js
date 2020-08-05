import React from "react";
import { IconButton } from "theme-ui";

import Count from "./DiceButtonCount";

function DiceButton({ title, children, count, onClick }) {
  return (
    <IconButton
      title={title}
      aria-label={title}
      onClick={onClick}
      sx={{ position: "relative" }}
    >
      {children}
      {count && <Count>{count}</Count>}
    </IconButton>
  );
}

export default DiceButton;

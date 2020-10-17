import React from "react";
import { IconButton } from "theme-ui";

function RadioIconButton({ title, onClick, isSelected, disabled, children }) {
  return (
    <IconButton
      aria-label={title}
      title={title}
      onClick={onClick}
      sx={{ color: isSelected ? "primary" : "text" }}
      disabled={disabled}
    >
      {children}
    </IconButton>
  );
}

RadioIconButton.defaultProps = {
  disabled: false,
};

export default RadioIconButton;

import React from "react";
import { Divider } from "theme-ui";

function StyledDivider({ vertical, color, fill }) {
  return (
    <Divider
      my={vertical ? 0 : 2}
      mx={vertical ? 2 : 0}
      bg={color}
      sx={{
        height: vertical ? (fill ? "100%" : "24px") : "2px",
        width: vertical ? "2px" : fill ? "100%" : "24px",
        borderRadius: "2px",
        opacity: 0.5,
      }}
    />
  );
}

StyledDivider.defaultProps = {
  vertical: false,
  color: "text",
  fill: false,
};

export default StyledDivider;

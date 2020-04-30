import React from "react";
import { Divider } from "theme-ui";

function StyledDivider({ vertical }) {
  return (
    <Divider
      my={vertical ? 0 : 2}
      mx={vertical ? 2 : 0}
      bg="text"
      sx={{
        height: vertical ? "24px" : "2px",
        width: vertical ? "2px" : "24px",
        borderRadius: "2px",
        opacity: 0.5,
      }}
    />
  );
}

StyledDivider.defaultProps = {
  vertical: false,
};

export default StyledDivider;

import React from "react";
import { Box, Text } from "theme-ui";

function TokenLabel({ token }) {
  return (
    <Box
      sx={{
        position: "absolute",
        transform: `scale(${0.3 / token.size}) translate(0, 20%)`,
        transformOrigin: "bottom center",
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Use SVG so text is scaled with token size */}
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        <foreignObject
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
        >
          <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
            <Text
              as="p"
              variant="heading"
              sx={{
                fontSize: "66px",
                textAlign: "center",
                verticalAlign: "middle",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                minWidth: "100%",
                display: "inline-block",
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                borderRadius: "66px",
                border: "2px solid",
                borderColor: "muted",
              }}
              bg="overlay"
              px={4}
            >
              {token.label}
            </Text>
          </Box>
        </foreignObject>
      </svg>
    </Box>
  );
}

export default TokenLabel;

import React from "react";
import { Image, Box, Text } from "theme-ui";

import tokenLabel from "../images/TokenLabel.png";

function TokenLabel({ label }) {
  return (
    <Box
      sx={{
        position: "absolute",
        transform: "scale(0.3) translate(0, 20%)",
        transformOrigin: "bottom center",
        pointerEvents: "none",
      }}
    >
      <Image src={tokenLabel} />
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <foreignObject width="100%" height="100%">
          <Text
            as="p"
            variant="heading"
            sx={{
              // This value is actually 66%
              fontSize: "66px",
              width: "100px",
              height: "100px",
              textAlign: "center",
              verticalAlign: "middle",
              lineHeight: 1.4,
            }}
          >
            {label}
          </Text>
        </foreignObject>
      </svg>
    </Box>
  );
}

export default TokenLabel;

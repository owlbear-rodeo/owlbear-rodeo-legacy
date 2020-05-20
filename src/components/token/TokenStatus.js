import React from "react";
import { Box } from "theme-ui";

import colors from "../../helpers/colors";

function TokenStatus({ token }) {
  return (
    <Box
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {token.statuses.map((status, index) => (
        <Box
          key={status}
          sx={{
            width: "100%",
            height: "100%",
            position: "absolute",
            opacity: 0.8,
            transform: `scale(${1 - index / 10 / token.size})`,
          }}
        >
          <svg
            style={{ position: "absolute" }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
          >
            <circle
              r={47}
              cx={50}
              cy={50}
              fill="none"
              stroke={colors[status]}
              strokeWidth={4 / token.size}
            />
          </svg>
        </Box>
      ))}
    </Box>
  );
}

export default TokenStatus;

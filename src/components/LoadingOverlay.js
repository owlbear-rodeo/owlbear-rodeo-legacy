import React from "react";
import { Box, Progress } from "theme-ui";

import Spinner from "./Spinner";

function LoadingOverlay({ progress }) {
  return (
    <Box
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        top: 0,
        left: 0,
        flexDirection: "column",
      }}
      bg="muted"
    >
      <Spinner />
      {progress && (
        <Progress max={1} value={progress} m={2} sx={{ width: "24px" }} />
      )}
    </Box>
  );
}

export default LoadingOverlay;

import React from "react";
import { Box } from "theme-ui";

import Spinner from "./Spinner";

type LoadingOverlayProps = {
  bg: string;
  children?: React.ReactNode;
};

function LoadingOverlay({ bg, children }: LoadingOverlayProps) {
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
        zIndex: 2,
      }}
      bg={bg}
    >
      <Spinner />
      {children}
    </Box>
  );
}

LoadingOverlay.defaultProps = {
  bg: "muted",
};

export default LoadingOverlay;

import React, { useContext } from "react";
import { Box } from "theme-ui";

import MapLoadingContext from "../../contexts/MapLoadingContext";

import LoadingBar from "../LoadingBar";

function MapLoadingOverlay() {
  const { isLoading, loadingProgressRef } = useContext(MapLoadingContext);

  return (
    isLoading && (
      <Box
        sx={{
          position: "absolute",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          top: 0,
          left: 0,
          right: 0,
          flexDirection: "column",
          zIndex: 2,
        }}
        bg="overlay"
      >
        <LoadingBar
          isLoading={isLoading}
          loadingProgressRef={loadingProgressRef}
        />
      </Box>
    )
  );
}

export default MapLoadingOverlay;

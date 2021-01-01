import React, { useContext, useEffect, useRef } from "react";
import { Box, Progress } from "theme-ui";

import MapLoadingContext from "../../contexts/MapLoadingContext";

function MapLoadingOverlay() {
  const { isLoading, loadingProgressRef } = useContext(MapLoadingContext);

  const requestRef = useRef();
  const progressBarRef = useRef();

  // Use an animation frame to update the progress bar
  // This bypasses react allowing the animation to be smooth
  useEffect(() => {
    function animate() {
      if (!isLoading) {
        return;
      }
      requestRef.current = requestAnimationFrame(animate);
      if (progressBarRef.current) {
        progressBarRef.current.value = loadingProgressRef.current;
      }
    }

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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
        <Progress
          ref={progressBarRef}
          max={1}
          value={0}
          m={0}
          sx={{ width: "100%", borderRadius: 0, height: "2px" }}
          color="primary"
        />
      </Box>
    )
  );
}

export default MapLoadingOverlay;

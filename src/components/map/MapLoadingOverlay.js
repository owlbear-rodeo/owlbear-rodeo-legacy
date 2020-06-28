import React, { useContext, useEffect, useRef } from "react";
import { Box, Progress } from "theme-ui";

import Spinner from "../Spinner";
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
        <Progress
          ref={progressBarRef}
          max={1}
          value={0}
          m={2}
          sx={{ width: "32px" }}
        />
      </Box>
    )
  );
}

export default MapLoadingOverlay;

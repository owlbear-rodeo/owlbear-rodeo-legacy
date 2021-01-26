import React, { useEffect, useRef } from "react";
import { Progress } from "theme-ui";

function LoadingBar({ isLoading, loadingProgressRef }) {
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
    <Progress
      ref={progressBarRef}
      max={1}
      value={0}
      m={0}
      sx={{ width: "100%", borderRadius: 0, height: "4px" }}
      color="primary"
    />
  );
}

export default LoadingBar;

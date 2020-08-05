import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Box, Progress } from "theme-ui";

import usePortal from "../../helpers/usePortal";

function Timer({ timer, index }) {
  const progressBarRef = useRef();

  useEffect(() => {
    if (progressBarRef.current && timer) {
      progressBarRef.current.value = timer.current;
    }
  }, [timer]);

  useEffect(() => {
    let request = requestAnimationFrame(animate);
    let previousTime = performance.now();
    function animate(time) {
      request = requestAnimationFrame(animate);
      const deltaTime = time - previousTime;
      previousTime = time;

      if (progressBarRef.current && progressBarRef.current.value > 0) {
        progressBarRef.current.value -= deltaTime;
      }
    }

    return () => {
      cancelAnimationFrame(request);
    };
  }, []);

  const timerContainer = usePortal("root");

  return ReactDOM.createPortal(
    <Box
      sx={{
        position: "absolute",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // Offset for iOS safe zone
        bottom: "env(safe-area-inset-bottom)",
        flexDirection: "column",
        borderRadius: "28px",
        left: "50%",
        maxWidth: "500px",
        width: "40%",
        transform: `translate(-50%, -${index * 36}px)`,
        padding: "0 8px",
        margin: "8px",
      }}
      bg="overlay"
    >
      <Progress
        max={timer && timer.max}
        m={2}
        sx={{ width: "100%" }}
        ref={progressBarRef}
      />
    </Box>,
    timerContainer
  );
}

export default Timer;

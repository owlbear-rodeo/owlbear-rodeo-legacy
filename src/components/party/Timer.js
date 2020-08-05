import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { Box, Progress } from "theme-ui";

import usePortal from "../../helpers/usePortal";

function getTimerDuration(t) {
  if (!t) {
    return 0;
  }
  return t.hour * 3600000 + t.minute * 60000 + t.second * 1000;
}

function Timer({ timer }) {
  const [maxDuration, setMaxDuration] = useState(0);

  const previousTimerRef = useRef(timer);
  useEffect(() => {
    if (!previousTimerRef.current && timer) {
      setMaxDuration(getTimerDuration(timer));
    }
    previousTimerRef.current = timer;
  });

  useEffect(() => {
    progressBarRef.current.value = getTimerDuration(timer);
  }, [timer]);

  const progressBarRef = useRef();

  useEffect(() => {
    let request = requestAnimationFrame(animate);
    let previousTime = performance.now();
    function animate(time) {
      request = requestAnimationFrame(animate);
      const deltaTime = time - previousTime;
      previousTime = time;

      progressBarRef.current.value -= deltaTime;
    }

    return () => {
      cancelAnimationFrame(request);
    };
  }, [maxDuration]);

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
        width: "60%",
        transform: "translateX(-50%)",
        padding: "0 8px",
        margin: "8px",
      }}
      bg="overlay"
    >
      <Progress
        max={maxDuration}
        m={2}
        sx={{ width: "100%" }}
        ref={progressBarRef}
      />
    </Box>,
    timerContainer
  );
}

export default Timer;

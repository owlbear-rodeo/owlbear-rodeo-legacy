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
  const [progress, setProgress] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);

  const previousTimerRef = useRef(timer);
  useEffect(() => {
    if (!previousTimerRef.current && timer) {
      setMaxDuration(getTimerDuration(timer));
    }
    previousTimerRef.current = timer;
  });

  useEffect(() => {
    setProgress(getTimerDuration(timer));
  }, [timer]);

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
        value={progress}
        m={2}
        sx={{ width: "100%" }}
      />
    </Box>,
    timerContainer
  );
}

export default Timer;

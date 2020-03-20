import React, { useRef, useEffect } from "react";
import { Box } from "theme-ui";

function PartyVideo({ stream, muted }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Box my={1}>
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        style={{ width: "100%", borderRadius: "4px" }}
      />
    </Box>
  );
}

export default PartyVideo;

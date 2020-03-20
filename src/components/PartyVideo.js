import React, { useRef, useEffect } from "react";

function PartyVideo({ stream, muted }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={muted}
      style={{ width: "100%", borderRadius: "4px", maxWidth: "500px" }}
      playsinline
    />
  );
}

export default PartyVideo;

import React, { useRef, useEffect } from "react";

function PartyVideo({ stream, muted }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay muted={muted} />;
}

export default PartyVideo;

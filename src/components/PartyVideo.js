import React, { useRef, useEffect } from "react";

function PartyVideo({ stream }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay muted />;
}

export default PartyVideo;

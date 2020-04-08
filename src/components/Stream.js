import React, { useRef, useEffect } from "react";

function Stream({ stream, muted }) {
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
      playsInline
      muted={muted}
      style={{ width: "100%" }}
    />
  );
}

Stream.defaultProps = {
  muted: false,
};

export default Stream;

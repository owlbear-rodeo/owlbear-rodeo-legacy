import React, { useRef, useEffect } from "react";

function Stream({ stream, muted }) {
  const audioRef = useRef();
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline muted={muted} />;
}

Stream.defaultProps = {
  muted: false,
};

export default Stream;

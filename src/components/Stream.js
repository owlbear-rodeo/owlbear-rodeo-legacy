import React, { useRef, useEffect } from "react";

function Stream({ stream, muted }) {
  const audioRef = useRef();
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play();
    }
  }, [stream]);

  return <audio ref={audioRef} playsInline muted={muted} />;
}

Stream.defaultProps = {
  muted: false,
};

export default Stream;

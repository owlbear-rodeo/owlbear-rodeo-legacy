import React, { useState, useRef, useEffect } from "react";
import { Text, IconButton, Box } from "theme-ui";

import Banner from "./Banner";

function Nickname({ nickname, stream }) {
  const [streamMuted, setStreamMuted] = useState(false);
  const [showStreamInteractBanner, setShowStreamInteractBanner] = useState(
    false
  );
  const audioRef = useRef();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      // Try and auto play the audio
      audioRef.current
        .play()
        .then(() => {
          // Played fine
        })
        .catch(() => {
          // Unable to autoplay
          setStreamMuted(true);
          setShowStreamInteractBanner(true);
        });
    }
  }, [stream]);

  function toggleMute() {
    if (audioRef.current) {
      if (streamMuted) {
        audioRef.current.play().then(() => {
          setStreamMuted(false);
          setShowStreamInteractBanner(false);
        });
      } else {
        setStreamMuted(true);
      }
    }
  }

  return (
    <>
      <Text
        as="p"
        my={1}
        variant="body2"
        sx={{
          position: "relative",
          cursor: stream ? "pointer" : "default",
        }}
        onClick={() => {
          if (stream) {
            toggleMute();
          }
        }}
      >
        {nickname}
        {stream && (
          <IconButton
            sx={{
              width: "14px",
              height: "14px",
              padding: 0,
              marginLeft: "2px",
              position: "absolute",
              bottom: "-2px",
            }}
            aria-label={streamMuted ? "Unmute Player" : "Mute Player"}
            title={streamMuted ? "Unmute Player" : "Mute Player"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="14"
              viewBox="0 0 24 24"
              width="14"
              fill="currentcolor"
            >
              {streamMuted ? (
                <path d="M3.63 3.63c-.39.39-.39 1.02 0 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
              ) : (
                <path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 4.45v.2c0 .38.25.71.6.85C17.18 6.53 19 9.06 19 12s-1.82 5.47-4.4 6.5c-.36.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85C18.6 19.11 21 15.84 21 12s-2.4-7.11-5.79-8.4c-.58-.23-1.21.22-1.21.85z" />
              )}
            </svg>
          </IconButton>
        )}
        {stream && <audio ref={audioRef} playsInline muted={streamMuted} />}
      </Text>
      <Banner
        isOpen={showStreamInteractBanner}
        onRequestClose={() => setShowStreamInteractBanner(false)}
      >
        <Box p={1}>
          <Text
            as="p"
            variant="body2"
            sx={{
              fontSize: "12px",
            }}
          >
            {nickname} has started streaming. Click
            {
              <IconButton
                sx={{
                  width: "14px",
                  height: "14px",
                  padding: 0,
                  margin: "0 4px",
                  verticalAlign: "bottom",
                }}
                aria-label={"Unmute Player"}
                title={"Unmute Player"}
                onClick={toggleMute}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="14"
                  viewBox="0 0 24 24"
                  width="14"
                  fill="currentcolor"
                >
                  <path d="M3.63 3.63c-.39.39-.39 1.02 0 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
                </svg>
              </IconButton>
            }
            to listen.
          </Text>
        </Box>
      </Banner>
    </>
  );
}

export default Nickname;

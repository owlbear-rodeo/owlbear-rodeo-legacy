import React, { useState, useRef, useEffect } from "react";
import { Text, IconButton, Box, Slider, Flex } from "theme-ui";

import StreamMuteIcon from "../../icons/StreamMuteIcon";

import Banner from "../Banner";

function Stream({ stream, nickname }) {
  const [streamVolume, setStreamVolume] = useState(0);
  const [showStreamInteractBanner, setShowStreamInteractBanner] = useState(
    false
  );
  const audioRef = useRef();
  const streamMuted = streamVolume === 0;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      // Try and auto play the audio
      audioRef.current
        .play()
        .then(() => {
          // Played fine
          setStreamVolume(1);
        })
        .catch(() => {
          // Unable to autoplay
          setStreamVolume(0);
          setShowStreamInteractBanner(true);
        });
    }
  }, [stream]);

  function toggleMute() {
    if (audioRef.current) {
      if (streamMuted) {
        audioRef.current.play().then(() => {
          setStreamVolume(1);
          setShowStreamInteractBanner(false);
        });
      } else {
        setStreamVolume(0);
      }
    }
  }

  function handleVolumeChange(event) {
    const volume = parseFloat(event.target.value);
    setStreamVolume(volume);
    if (showStreamInteractBanner) {
      audioRef.current.play().then(() => {
        setShowStreamInteractBanner(false);
      });
    }
  }

  // Use an audio context gain node to control volume to go past 100%
  const audioGainRef = useRef();
  useEffect(() => {
    if (stream && !streamMuted) {
      let audioContext = new AudioContext();
      let source = audioContext.createMediaStreamSource(stream);
      let gainNode = audioContext.createGain();
      gainNode.gain.value = 0;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      audioGainRef.current = gainNode;
    }
  }, [stream, streamMuted]);

  // Platforms like iOS don't allow you to control audio volume
  // Detect this by trying to change the audio volume
  const [isVolumeControlAvailable, setIsVolumeControlAvailable] = useState(
    true
  );
  useEffect(() => {
    if (audioRef.current) {
      const prevVolume = audioRef.current.volume;
      audioRef.current.volume = 0.5;
      setIsVolumeControlAvailable(audioRef.current.volume === 0.5);
      audioRef.current.volume = prevVolume;
    }
  }, [stream]);

  useEffect(() => {
    if (audioGainRef.current && audioRef.current) {
      if (streamVolume <= 1) {
        audioGainRef.current.gain.value = 0;
        audioRef.current.volume = streamVolume;
      } else {
        audioRef.current.volume = 1;
        audioGainRef.current.gain.value = (streamVolume - 1) * 2;
      }
    }
  }, [streamVolume]);

  return (
    <>
      <Flex sx={{ alignItems: "center", height: "24px" }}>
        <IconButton
          aria-label={streamMuted ? "Unmute Player" : "Mute Player"}
          title={streamMuted ? "Unmute Player" : "Mute Player"}
          onClick={() => {
            if (stream) {
              toggleMute();
            }
          }}
        >
          <StreamMuteIcon muted={streamMuted} />
        </IconButton>
        <Slider
          value={streamVolume}
          min={0}
          max={2}
          step={0.1}
          onChange={handleVolumeChange}
          disabled={!isVolumeControlAvailable}
        />
        {stream && <audio ref={audioRef} playsInline muted={streamMuted} />}
      </Flex>
      <Banner
        isOpen={showStreamInteractBanner}
        onRequestClose={() => setShowStreamInteractBanner(false)}
      >
        <Box p={1}>
          <Text as="p" variant="body2">
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

export default Stream;

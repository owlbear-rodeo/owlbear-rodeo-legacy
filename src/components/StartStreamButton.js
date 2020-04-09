import React, { useState } from "react";
import { IconButton, Box, Text, Button, Label, Flex } from "theme-ui";
import adapter from "webrtc-adapter";

import Modal from "./Modal";

function StartStreamButton({ onStreamStart, onStreamEnd, stream }) {
  const [isStreamModalOpoen, setIsStreamModalOpen] = useState(false);
  function openModal() {
    setIsStreamModalOpen(true);
  }
  function closeModal() {
    setIsStreamModalOpen(false);
    setNoAudioTrack(false);
  }

  const unavailableMessage = (
    <Box p={2} bg="hsla(230, 20%, 0%, 20%)">
      <Text as="p">
        Browser not supported.
        <br />
        <br />
        See FAQ for more information.
      </Text>
    </Box>
  );

  const noAudioMessage = (
    <Box p={2} bg="hsla(230, 20%, 0%, 20%)">
      <Text as="p">
        No audio found in screen share.
        <br />
        Ensure "Share audio" is selected when sharing.
        <br />
        <br />
        See FAQ for more information.
      </Text>
    </Box>
  );

  const isSupported = adapter.browserDetails.browser === "chrome";
  const [noAudioTrack, setNoAudioTrack] = useState(false);

  function handleStreamStart() {
    navigator.mediaDevices
      .getDisplayMedia({
        video: true,
        audio: {
          noiseSuppression: false,
          autoGainControl: false,
          echoCancellation: false,
        },
      })
      .then((localStream) => {
        const tracks = localStream.getTracks();

        const hasAudio = tracks.some((track) => track.kind === "audio");
        setNoAudioTrack(!hasAudio);

        // Ensure an audio track is present
        if (hasAudio) {
          onStreamStart && onStreamStart(localStream);
          closeModal();
        } else {
          // Stop the stream
          for (let track of tracks) {
            track.stop();
          }
        }
      })
      .catch(() => {});
  }

  return (
    <>
      <IconButton
        m={1}
        aria-label="Start Radio Stream"
        title="Start Radio Stream"
        onClick={openModal}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          fill="currentcolor"
        >
          <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.9 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8.3l7.43-3c.46-.19.68-.71.49-1.17-.19-.46-.71-.68-1.17-.49L3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V9c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v3z" />
        </svg>
      </IconButton>
      <Modal isOpen={isStreamModalOpoen} onRequestClose={closeModal}>
        <Box>
          <Label pt={2} pb={1}>
            Radio (experimental)
          </Label>
          <Text as="p" mb={2} variant="caption">
            Share your computers audio with the party
          </Text>
          {!isSupported && unavailableMessage}
          {isSupported && !stream && noAudioTrack && noAudioMessage}
          <Flex py={2}>
            {isSupported && !stream && (
              <Button sx={{ flexGrow: 1 }} onClick={handleStreamStart}>
                Start Radio
              </Button>
            )}
            {isSupported && stream && (
              <Button sx={{ flexGrow: 1 }} onClick={() => onStreamEnd(stream)}>
                Stop Radio
              </Button>
            )}
          </Flex>
        </Box>
      </Modal>
    </>
  );
}

export default StartStreamButton;

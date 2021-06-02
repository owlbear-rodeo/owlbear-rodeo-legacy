import { Box, Text, Button, Label, Flex } from "theme-ui";

import Modal from "../components/Modal";

type StartStreamProps = {
  isOpen: boolean,
  onRequestClose: () => void,
  isSupported: boolean,
  unavailableMessage: string,
  stream: MediaStream,
  noAudioTrack: boolean,
  noAudioMessage: string,
  onStreamStart: any,
  onStreamEnd: any,
}

function StartStreamModal({
  isOpen,
  onRequestClose,
  isSupported,
  unavailableMessage,
  stream,
  noAudioTrack,
  noAudioMessage,
  onStreamStart,
  onStreamEnd,
}: StartStreamProps) {
  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <Box>
        <Label pt={2} pb={1}>
          Audio Sharing (experimental)
        </Label>
        <Text as="p" mb={2} variant="caption">
          Share your computers audio with the party
        </Text>
        {!isSupported && unavailableMessage}
        {isSupported && !stream && noAudioTrack && noAudioMessage}
        <Flex py={2}>
          {isSupported && !stream && (
            <Button sx={{ flexGrow: 1 }} onClick={onStreamStart}>
              Start Sharing
            </Button>
          )}
          {isSupported && stream && (
            <Button sx={{ flexGrow: 1 }} onClick={() => onStreamEnd(stream)}>
              Stop Sharing
            </Button>
          )}
        </Flex>
      </Box>
    </Modal>
  );
}

export default StartStreamModal;

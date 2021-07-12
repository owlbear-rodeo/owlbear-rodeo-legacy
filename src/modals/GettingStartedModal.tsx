import { Box, Label, Text } from "theme-ui";
import raw from "raw.macro";

import Modal from "../components/Modal";
import Markdown from "../components/Markdown";
import Link from "../components/Link";

import { RequestCloseEventHandler } from "../types/Events";

const gettingStarted = raw("../docs/howTo/gettingStarted.md");

type GettingStartedModalProps = {
  isOpen: boolean;
  onRequestClose: RequestCloseEventHandler;
};

function GettingStartedModal({
  isOpen,
  onRequestClose,
}: GettingStartedModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ content: { maxWidth: "450px" } }}
    >
      <Box>
        <Label py={2}>Getting Started</Label>
        <Markdown source={gettingStarted} />
        <Text variant="body2" my={2}>
          For more tutorials visit the <Link to="/how-to">How To</Link> page
        </Text>
      </Box>
    </Modal>
  );
}

export default GettingStartedModal;

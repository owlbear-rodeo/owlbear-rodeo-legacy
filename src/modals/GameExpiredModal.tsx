import { Box, Label, Flex, Button, Text } from "theme-ui";

import Modal from "../components/Modal";

type GameExpiredModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
};

function GameExpiredModal({ isOpen, onRequestClose }: GameExpiredModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ content: { maxWidth: "450px" } }}
    >
      <Box>
        <Label py={2}>Game Timed Out</Label>
        <Text as="p" mb={2} variant="caption">
          Reselect your map to pick up where you left off.
        </Text>
        <Flex py={2}>
          <Button sx={{ flexGrow: 1 }} m={1} ml={0} onClick={onRequestClose}>
            Ok
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
}

export default GameExpiredModal;

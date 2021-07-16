import { Box, Label, Text } from "theme-ui";

import Modal from "../components/Modal";

function AddPartyMemberModal({
  isOpen,
  onRequestClose,
  gameId,
}: {
  isOpen: boolean;
  onRequestClose;
  gameId: string;
}) {
  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <Box>
        <Label pt={2} pb={1}>
          Invite players
        </Label>
        <Text as="p" mb={2} variant="caption">
          Other people can join using the game ID
        </Text>
        <Box p={2} bg="hsla(230, 20%, 0%, 20%)">
          <Text>{gameId}</Text>
        </Box>
        <Text as="p" my={2} variant="caption">
          Or by using this link
        </Text>
        <Box p={2} bg="hsla(230, 20%, 0%, 20%)">
          <Text>{window.location.href}</Text>
        </Box>
      </Box>
    </Modal>
  );
}

export default AddPartyMemberModal;

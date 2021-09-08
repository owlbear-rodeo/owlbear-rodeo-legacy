import { Box, Label, Flex, Button, Text } from "theme-ui";

import Modal from "../components/Modal";

import { RequestCloseEventHandler } from "../types/Events";

type MaintenanceModalProps = {
  isOpen: boolean;
  onRequestClose: RequestCloseEventHandler;
};

function MaintenanceModal({ isOpen, onRequestClose }: MaintenanceModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ content: { maxWidth: "450px" } }}
    >
      <Box>
        <Label py={2}>Site under maintenance</Label>
        <Text as="p" mb={2} variant="caption">
          Continue offline?
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

export default MaintenanceModal;

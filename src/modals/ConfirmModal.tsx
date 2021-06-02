import { Box, Label, Flex, Button, Text } from "theme-ui";

import Modal from "../components/Modal";

type ConfirmModalProps = {
  isOpen:  boolean,
  onRequestClose: () => void,
  onConfirm: () => void,
  confirmText: string,
  label: string,
  description: string,
}

function ConfirmModal({
  isOpen,
  onRequestClose,
  onConfirm,
  confirmText,
  label,
  description,
}: ConfirmModalProps ) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ content: { maxWidth: "300px" } }}
    >
      <Box>
        <Label py={2}>{label}</Label>
        {description && (
          <Text as="p" mb={2} variant="caption">
            {description}
          </Text>
        )}
        <Flex py={2}>
          <Button sx={{ flexGrow: 1 }} m={1} ml={0} onClick={onRequestClose}>
            Cancel
          </Button>
          <Button sx={{ flexGrow: 1 }} m={1} mr={0} onClick={onConfirm}>
            {confirmText}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
}

ConfirmModal.defaultProps = {
  label: "Are you sure?",
  description: "",
  confirmText: "Yes",
};

export default ConfirmModal;

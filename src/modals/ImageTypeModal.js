import React from "react";
import { Box, Label, Flex, Button } from "theme-ui";

import Modal from "../components/Modal";

function ImageTypeModal({
  isOpen,
  onRequestClose,
  multiple,
  onTokens,
  onMaps,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ maxWidth: "300px" }}
    >
      <Box>
        <Label py={2}>Import image{multiple ? "s" : ""} as</Label>
        <Flex py={2}>
          <Button sx={{ flexGrow: 1 }} m={1} ml={0} onClick={onTokens}>
            Token{multiple ? "s" : ""}
          </Button>
          <Button sx={{ flexGrow: 1 }} m={1} mr={0} onClick={onMaps}>
            Map{multiple ? "s" : ""}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
}

export default ImageTypeModal;

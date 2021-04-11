import React from "react";
import { Box, Label, Text } from "theme-ui";

import Modal from "../components/Modal";

function ForceUpdateModal({ isOpen }) {
  return (
    <Modal
      isOpen={isOpen}
      allowClose={false}
      style={{ maxWidth: "450px" }}
    >
      <Box>
        <Label py={2}>New Update Available</Label>
        <Text as="p" mb={2} variant="caption">
          Please refresh your browser to update to the latest version.
        </Text>
      </Box>
    </Modal>
  );
}

export default ForceUpdateModal;

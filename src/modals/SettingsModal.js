import React, { useState } from "react";
import { Box, Label, Flex, Button } from "theme-ui";

import Modal from "../components/Modal";

import db from "../database";

function SettingsModal({ isOpen, onRequestClose }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  async function handleEraseAllData() {
    await db.delete();
    window.location.reload();
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <Box>
        <Label py={2}>Settings</Label>
        <Flex py={2}>
          <Button
            sx={{ flexGrow: 1 }}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Erase all content and reset
          </Button>
        </Flex>
        <Modal
          isOpen={isDeleteModalOpen}
          onRequestClose={() => setIsDeleteModalOpen(false)}
        >
          <Box>
            <Label py={2}>Are you sure?</Label>
            <Flex py={2}>
              <Button
                sx={{ flexGrow: 1 }}
                m={1}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button m={1} sx={{ flexGrow: 1 }} onClick={handleEraseAllData}>
                Erase
              </Button>
            </Flex>
          </Box>
        </Modal>
      </Box>
    </Modal>
  );
}

export default SettingsModal;

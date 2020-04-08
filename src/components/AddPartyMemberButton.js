import React, { useState } from "react";
import { IconButton, Box, Label, Text } from "theme-ui";

import Modal from "./Modal";

function AddPartyMemberButton({ gameId }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  function openModal() {
    setIsAddModalOpen(true);
  }
  function closeModal() {
    setIsAddModalOpen(false);
  }

  return (
    <>
      <IconButton m={1} aria-label="Add Party Member" onClick={openModal}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          fill="currentcolor"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 11h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H8c-.55 0-1-.45-1-1s.45-1 1-1h3V8c0-.55.45-1 1-1s1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1z" />
        </svg>
      </IconButton>
      <Modal isOpen={isAddModalOpen} onRequestClose={closeModal}>
        <Box>
          <Label p={2}>Other people can join using your ID</Label>
          <Box p={2} bg="hsla(230, 20%, 0%, 20%)">
            <Text>{gameId}</Text>
          </Box>
          <Label p={2}>Or by using this link</Label>
          <Box p={2} bg="hsla(230, 20%, 0%, 20%)">
            <Text>{window.location.href}</Text>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

export default AddPartyMemberButton;

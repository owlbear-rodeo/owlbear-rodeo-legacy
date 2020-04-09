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
      <IconButton
        m={1}
        aria-label="Add Party Member"
        title="Add Party Member"
        onClick={openModal}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          fill="currentcolor"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8c0-.55-.45-1-1-1s-1 .45-1 1v2H2c-.55 0-1 .45-1 1s.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1H6zm9 4c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z" />
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

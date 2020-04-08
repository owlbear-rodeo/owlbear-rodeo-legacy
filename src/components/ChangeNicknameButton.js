import React, { useState } from "react";
import { Box, Input, Button, Label, IconButton, Flex } from "theme-ui";

import Modal from "./Modal";

function ChangeNicknameButton({ nickname, onChange }) {
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  function openModal() {
    setIsChangeModalOpen(true);
  }
  function closeModal() {
    setIsChangeModalOpen(false);
  }

  const [changedNickname, setChangedNickname] = useState(nickname);
  function handleChangeSubmit(event) {
    event.preventDefault();
    onChange(changedNickname);
    closeModal();
  }

  function handleChange(event) {
    setChangedNickname(event.target.value);
  }
  return (
    <>
      <IconButton m={1} aria-label="Change Nickname" onClick={openModal}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          fill="currentcolor"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M3 17.46v3.04c0 .28.22.5.5.5h3.04c.13 0 .26-.05.35-.15L17.81 9.94l-3.75-3.75L3.15 17.1c-.1.1-.15.22-.15.36zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </svg>
      </IconButton>
      <Modal isOpen={isChangeModalOpen} onRequestClose={closeModal}>
        <Box as="form" onSubmit={handleChangeSubmit}>
          <Label p={2} htmlFor="nicknameChange">
            Change your nickname
          </Label>
          <Input
            id="nicknameChange"
            value={changedNickname}
            onChange={handleChange}
          />
          <Flex py={2}>
            <Button sx={{ flexGrow: 1 }} disabled={!changedNickname}>
              Change
            </Button>
          </Flex>
        </Box>
      </Modal>
    </>
  );
}

export default ChangeNicknameButton;

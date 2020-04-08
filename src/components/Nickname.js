import React, { useState } from "react";
import { Text, Box, Input, Button, Label, IconButton, Flex } from "theme-ui";

import Modal from "./Modal";

function Nickname({ nickname, allowChanging, onChange, onStream }) {
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
    if (allowChanging) {
      onChange(changedNickname);
      closeModal();
    }
  }

  function handleChange(event) {
    setChangedNickname(event.target.value);
  }

  return (
    <>
      <Text
        my={1}
        variant="caption"
        sx={{
          fontSize: 10,
          position: "relative",
        }}
      >
        {nickname}
        {allowChanging && (
          <IconButton
            sx={{
              width: "10px",
              height: "10px",
              padding: 0,
              margin: "2px",
              position: "absolute",
              bottom: "-2px",
            }}
            aria-label="Start Radio Stream"
            onClick={() => allowChanging && onStream()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="10"
              viewBox="0 0 24 24"
              width="10"
              fill="currentcolor"
            >
              <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.9 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8.3l7.43-3c.46-.19.68-.71.49-1.17-.19-.46-.71-.68-1.17-.49L3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V9c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v3z" />
            </svg>
          </IconButton>
        )}
        {allowChanging && (
          <IconButton
            sx={{
              width: "10px",
              height: "10px",
              padding: 0,
              margin: "2px",
              position: "absolute",
              bottom: "-2px",
              transform: "translateX(12px)",
            }}
            aria-label="Change Nickname"
            onClick={() => allowChanging && openModal()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="10"
              viewBox="0 0 24 24"
              width="10"
              fill="currentcolor"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M3 17.46v3.04c0 .28.22.5.5.5h3.04c.13 0 .26-.05.35-.15L17.81 9.94l-3.75-3.75L3.15 17.1c-.1.1-.15.22-.15.36zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </IconButton>
        )}
      </Text>
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

Nickname.defaultProps = {
  allowChanging: false,
  onChange: () => {},
  onStream: () => {},
};

export default Nickname;

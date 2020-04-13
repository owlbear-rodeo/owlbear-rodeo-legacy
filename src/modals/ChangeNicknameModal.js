import React, { useRef } from "react";
import { Box, Input, Button, Label, Flex } from "theme-ui";

import Modal from "../components/Modal";

function ChangeNicknameModal({
  isOpen,
  onRequestClose,
  onChangeSubmit,
  nickname,
  onChange,
}) {
  const inputRef = useRef();
  function focusInput() {
    inputRef.current && inputRef.current.focus();
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      onAfterOpen={focusInput}
    >
      <Box as="form" onSubmit={onChangeSubmit}>
        <Label py={2} htmlFor="nicknameChange">
          Change your nickname
        </Label>
        <Input
          id="nicknameChange"
          value={nickname}
          onChange={onChange}
          ref={inputRef}
        />
        <Flex py={2}>
          <Button sx={{ flexGrow: 1 }} disabled={!nickname}>
            Change
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
}

export default ChangeNicknameModal;

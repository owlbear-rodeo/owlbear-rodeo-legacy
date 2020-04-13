import React from "react";
import { Box, Input, Button, Label, Flex } from "theme-ui";

import Modal from "../components/Modal";

function ChangeNicknameModal({
  isOpen,
  onRequestClose,
  onChangeSubmit,
  nickname,
  onChange,
}) {
  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <Box as="form" onSubmit={onChangeSubmit}>
        <Label py={2} htmlFor="nicknameChange">
          Change your nickname
        </Label>
        <Input id="nicknameChange" value={nickname} onChange={onChange} />
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

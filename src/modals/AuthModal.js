import React, { useState, useContext, useRef } from "react";
import { Box, Input, Button, Label, Flex } from "theme-ui";

import AuthContext from "../contexts/AuthContext";

import Modal from "../components/Modal";

function AuthModal({ isOpen }) {
  const { password, setPassword, setAuthenticationStatus } = useContext(
    AuthContext
  );
  const [tmpPassword, setTempPassword] = useState(password);

  function handleChange(event) {
    setTempPassword(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setAuthenticationStatus("unknown");
    setPassword(tmpPassword);
  }

  const inputRef = useRef();
  function focusInput() {
    inputRef.current && inputRef.current.focus();
  }

  return (
    <Modal isOpen={isOpen} allowClose={false} onAfterOpen={focusInput}>
      <Box as="form" onSubmit={handleSubmit}>
        <Label py={2} htmlFor="password">
          Enter password
        </Label>
        <Input
          id="password"
          value={tmpPassword}
          onChange={handleChange}
          ref={inputRef}
          autoComplete="off"
        />
        <Flex py={2}>
          <Button sx={{ flexGrow: 1 }} disabled={!tmpPassword}>
            Join
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
}

export default AuthModal;

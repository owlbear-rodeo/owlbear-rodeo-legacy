import React, { useState, useRef } from "react";
import { Box, Label, Input, Button, Flex } from "theme-ui";
import { useHistory } from "react-router-dom";

import Modal from "../components/Modal";

function JoinModal({ isOpen, onRequestClose }) {
  let history = useHistory();
  const [gameId, setGameId] = useState("");

  function handleChange(event) {
    setGameId(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    history.push(`/game/${gameId}`);
  }

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
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "300px",
          flexGrow: 1,
        }}
        m={2}
      >
        <Box as="form" onSubmit={handleSubmit}>
          <Label htmlFor="id">Let me see your identification</Label>
          <Input
            mt={1}
            mb={3}
            id="id"
            name="id"
            value={gameId || ""}
            onChange={handleChange}
            ref={inputRef}
          />
          <Flex>
            <Button sx={{ flexGrow: 1 }} disabled={!gameId}>
              Join
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Modal>
  );
}

export default JoinModal;

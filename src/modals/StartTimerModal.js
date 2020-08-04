import React, { useState, useRef } from "react";
import { Box, Label, Input, Button, Flex, Text } from "theme-ui";

import Modal from "../components/Modal";

function StartTimerModal({ isOpen, onRequestClose }) {
  const inputRef = useRef();
  function focusInput() {
    inputRef.current && inputRef.current.focus();
  }

  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [second, setSecond] = useState(0);

  function handleSubmit(event) {
    event.preventDefault();
  }

  const inputStyle = {
    width: "70px",
    border: "none",
    ":focus": {
      outline: "none",
    },
    fontSize: "32px",
    padding: 2,
    paddingLeft: 0,
  };

  function parseValue(value, max) {
    const num = parseInt(value);
    if (isNaN(num)) {
      return 0;
    }
    return Math.min(num, max);
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
          <Label py={2}>Start a countdown timer</Label>
          <Flex mb={2} sx={{ flexGrow: 1, alignItems: "baseline" }}>
            <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
              H:
            </Text>
            <Input
              sx={inputStyle}
              value={`${hour}`}
              onChange={(e) => setHour(parseValue(e.target.value, 24))}
              type="number"
              min={0}
              max={24}
            />
            <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
              M:
            </Text>
            <Input
              sx={inputStyle}
              value={`${minute}`}
              onChange={(e) => setMinute(parseValue(e.target.value, 59))}
              type="number"
              ref={inputRef}
              min={0}
              max={59}
            />
            <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
              S:
            </Text>
            <Input
              sx={inputStyle}
              value={`${second}`}
              onChange={(e) => setSecond(parseValue(e.target.value, 59))}
              type="number"
              min={0}
              max={59}
            />
          </Flex>
          <Flex>
            <Button
              sx={{ flexGrow: 1 }}
              disabled={hour === 0 && minute === 0 && second === 0}
            >
              Start Timer
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Modal>
  );
}

export default StartTimerModal;

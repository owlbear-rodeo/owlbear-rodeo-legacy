import React from "react";
import { Box, Flex, IconButton, Text } from "theme-ui";

function SizeInput({ value, onChange }) {
  return (
    <Box>
      <Text sx={{ textAlign: "center" }} variant="heading">
        Size
      </Text>
      <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
        <IconButton
          aria-label="Lower token size"
          onClick={() => value > 1 && onChange(value - 1)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            fill="currentcolor"
          >
            <path d="M0 0h24v24H0V0z" fill="none" />
            <path d="M18 13H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1z" />
          </svg>
        </IconButton>
        <Text>{value}</Text>
        <IconButton
          aria-label="Increase token size"
          onClick={() => onChange(value + 1)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            fill="currentcolor"
          >
            <path d="M0 0h24v24H0V0z" fill="none" />
            <path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z" />
          </svg>
        </IconButton>
      </Flex>
    </Box>
  );
}

SizeInput.defaultProps = {
  value: 1,
  onChange: () => {},
};

export default SizeInput;

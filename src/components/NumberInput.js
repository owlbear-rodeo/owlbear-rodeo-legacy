import React from "react";
import { Box, Flex, IconButton, Text } from "theme-ui";

function NumberInput({ value, onChange, title, min, max }) {
  return (
    <Box>
      <Text sx={{ textAlign: "center" }} variant="heading" as="h1">
        {title}
      </Text>
      <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
        <IconButton
          aria-label={`Decrease ${title}`}
          title={`Decrease ${title}`}
          onClick={() => value > min && onChange(value - 1)}
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
        <Text as="p" aria-label={`Current ${title}`}>
          {value}
        </Text>
        <IconButton
          aria-label={`Increase ${title}`}
          title={`Increase ${title}`}
          onClick={() => value < max && onChange(value + 1)}
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

NumberInput.defaultProps = {
  value: 1,
  onChange: () => {},
  title: "Number",
  min: 0,
  max: 10,
};

export default NumberInput;

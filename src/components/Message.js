import React from "react";
import { Box, Text, Flex } from "theme-ui";

function Message({ message }) {
  const timeFormatted = new Date(message.time).toLocaleTimeString("en-US");

  return (
    <Box sx={{ width: "100%" }} my={1}>
      <Flex>
        <Text variant="heading">{message.nickname}</Text>
        {/* <Text variant="caption">{timeFormatted}</Text> */}
      </Flex>
      <Text variant="message">{message.text}</Text>
    </Box>
  );
}

export default Message;

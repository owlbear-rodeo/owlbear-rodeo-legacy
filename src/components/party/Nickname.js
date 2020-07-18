import React from "react";
import { Text, Flex } from "theme-ui";

import Stream from "./Stream";

function Nickname({ nickname, stream }) {
  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Text
        as="p"
        my={1}
        variant="body2"
        sx={{
          position: "relative",
        }}
      >
        {nickname}
      </Text>
      {stream && <Stream stream={stream} nickname={nickname} />}
    </Flex>
  );
}

export default Nickname;

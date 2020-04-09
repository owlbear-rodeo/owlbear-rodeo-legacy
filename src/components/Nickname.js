import React from "react";
import { Text } from "theme-ui";

import Stream from "./Stream";

function Nickname({ nickname, stream }) {
  return (
    <Text
      as="p"
      my={1}
      variant="body2"
      sx={{
        position: "relative",
      }}
    >
      {nickname}
      {stream && <Stream stream={stream} nickname={nickname} />}
    </Text>
  );
}

export default Nickname;

import React from "react";
import { Text } from "theme-ui";

function Nickname({ nickname }) {
  return (
    <Text
      my={1}
      variant="caption"
      sx={{
        fontSize: 10,
        position: "relative",
      }}
    >
      {nickname}
    </Text>
  );
}

export default Nickname;

import React from "react";
import { Text, Flex } from "theme-ui";

import Stream from "./Stream";
import DiceRolls from "./DiceRolls";

function Nickname({ nickname, stream, diceRolls }) {
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
      {diceRolls && <DiceRolls rolls={diceRolls} />}
    </Flex>
  );
}

export default Nickname;

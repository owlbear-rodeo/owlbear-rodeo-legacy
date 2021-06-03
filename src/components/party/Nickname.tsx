import { Text, Flex } from "theme-ui";

import Stream from "./Stream";
import DiceRolls from "./DiceRolls";

// TODO: check if stream is a required or optional param
function Nickname({ nickname, stream, diceRolls }: { nickname: string, stream?: any, diceRolls: any}) {
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

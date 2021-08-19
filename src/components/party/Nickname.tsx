import { Text, Flex } from "theme-ui";

import Stream from "./Stream";
import DiceRolls from "./DiceRolls";
import { DiceRoll } from "../../types/Dice";

type NicknameProps = {
  nickname: string;
  stream?: MediaStream;
  diceRolls?: DiceRoll[];
};

function Nickname({ nickname, stream, diceRolls }: NicknameProps) {
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

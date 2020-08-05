import React from "react";
import { Flex, Text } from "theme-ui";

import DiceRollsIcon from "../../icons/DiceRollsIcon";

import { getDiceRollTotal } from "../../helpers/dice";

function DiceRolls({ rolls }) {
  const total = getDiceRollTotal(rolls);
  return (
    total > 0 && (
      <Flex p={1}>
        <DiceRollsIcon />
        <Text px={1} as="p" my={1} variant="body2" sx={{ width: "100%" }}>
          {total}
        </Text>
      </Flex>
    )
  );
}

export default DiceRolls;

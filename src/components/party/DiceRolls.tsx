import { useState } from "react";
import { Flex, Text, IconButton } from "theme-ui";

import DiceRollsIcon from "../../icons/DiceRollsIcon";
import D20Icon from "../../icons/D20Icon";
import D12Icon from "../../icons/D12Icon";
import D10Icon from "../../icons/D10Icon";
import D8Icon from "../../icons/D8Icon";
import D6Icon from "../../icons/D6Icon";
import D4Icon from "../../icons/D4Icon";
import D100Icon from "../../icons/D100Icon";

import DiceRoll from "./DiceRoll";

import { getDiceRollTotal } from "../../helpers/dice";

const diceIcons = [
  { type: "d20", Icon: D20Icon },
  { type: "d12", Icon: D12Icon },
  { type: "d10", Icon: D10Icon },
  { type: "d8", Icon: D8Icon },
  { type: "d6", Icon: D6Icon },
  { type: "d4", Icon: D4Icon },
  { type: "d100", Icon: D100Icon },
];

function DiceRolls({ rolls }: { rolls: any }) {
  const total = getDiceRollTotal(rolls);

  const [expanded, setExpanded] = useState<boolean>(false);

  let expandedRolls = [];
  for (let icon of diceIcons) {
    if (rolls.some((roll: any) => roll.type === icon.type)) {
      expandedRolls.push(
        <DiceRoll rolls={rolls} type={icon.type} key={icon.type}>
          <icon.Icon />
        </DiceRoll>
      );
    }
  }

  if (total <= 0) {
    return null;
  }

  return (
      <Flex sx={{ flexDirection: "column" }}>
        <Flex sx={{ alignItems: "center" }}>
          <IconButton
            title={expanded ? "Hide Rolls" : "Show Rolls"}
            aria-label={expanded ? "Hide Rolls" : "Show Rolls"}
            onClick={() => setExpanded(!expanded)}
          >
            <DiceRollsIcon />
          </IconButton>
          <Text px={1} as="p" my={1} variant="body2" sx={{ width: "100%" }}>
            {total}
          </Text>
        </Flex>
        {expanded && (
          <Flex
            sx={{
              flexDirection: "column",
            }}
          >
            {expandedRolls}
          </Flex>
        )}
      </Flex>
  );
}

export default DiceRolls;

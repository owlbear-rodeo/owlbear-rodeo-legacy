import React, { useState } from "react";
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

function DiceRolls({ rolls }) {
  const total = getDiceRollTotal(rolls);

  const [expanded, setExpanded] = useState(false);

  return (
    total > 0 && (
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
            <DiceRoll rolls={rolls} type="d20">
              <D20Icon />
            </DiceRoll>
            <DiceRoll rolls={rolls} type="d12">
              <D12Icon />
            </DiceRoll>
            <DiceRoll rolls={rolls} type="d10">
              <D10Icon />
            </DiceRoll>
            <DiceRoll rolls={rolls} type="d8">
              <D8Icon />
            </DiceRoll>
            <DiceRoll rolls={rolls} type="d6">
              <D6Icon />
            </DiceRoll>
            <DiceRoll rolls={rolls} type="d4">
              <D4Icon />
            </DiceRoll>
            <DiceRoll rolls={rolls} type="d100">
              <D100Icon />
            </DiceRoll>
          </Flex>
        )}
      </Flex>
    )
  );
}

export default DiceRolls;

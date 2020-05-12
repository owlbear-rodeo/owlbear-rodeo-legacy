import React from "react";
import { Flex, IconButton } from "theme-ui";

import SunsetDice from "../../../dice/sunset/SunsetDice";

import D20Icon from "../../../icons/D20Icon";
import D12Icon from "../../../icons/D12Icon";
import D10Icon from "../../../icons/D10Icon";
import D8Icon from "../../../icons/D8Icon";
import D6Icon from "../../../icons/D6Icon";
import D4Icon from "../../../icons/D4Icon";

function DiceControls({ onDiceAdd }) {
  return (
    <Flex>
      <IconButton
        title="Add D20"
        aria-label="Add D20"
        onClick={() => onDiceAdd(SunsetDice, "d20")}
      >
        <D20Icon />
      </IconButton>
      <IconButton
        title="Add D12"
        aria-label="Add D12"
        onClick={() => onDiceAdd(SunsetDice, "d12")}
      >
        <D12Icon />
      </IconButton>
      <IconButton
        title="Add D10"
        aria-label="Add D10"
        onClick={() => onDiceAdd(SunsetDice, "d10")}
      >
        <D10Icon />
      </IconButton>
      <IconButton
        title="Add D8"
        aria-label="Add D8"
        onClick={() => onDiceAdd(SunsetDice, "d8")}
      >
        <D8Icon />
      </IconButton>
      <IconButton
        title="Add D6"
        aria-label="Add D6"
        onClick={() => onDiceAdd(SunsetDice, "d6")}
      >
        <D6Icon />
      </IconButton>
      <IconButton
        title="Add D4"
        aria-label="Add D4"
        onClick={() => onDiceAdd(SunsetDice, "d4")}
      >
        <D4Icon />
      </IconButton>
    </Flex>
  );
}

export default DiceControls;

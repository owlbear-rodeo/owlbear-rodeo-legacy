import React from "react";
import { Flex } from "theme-ui";

import SunsetDice from "../../../dice/galaxy/GalaxyDice";

import D20Icon from "../../../icons/D20Icon";
import D12Icon from "../../../icons/D12Icon";
import D10Icon from "../../../icons/D10Icon";
import D8Icon from "../../../icons/D8Icon";
import D6Icon from "../../../icons/D6Icon";
import D4Icon from "../../../icons/D4Icon";
import D100Icon from "../../../icons/D100Icon";

import DiceButton from "./DiceButton";

function DiceButtons({ diceRolls, onDiceAdd }) {
  const diceCounts = {};
  for (let dice of diceRolls) {
    if (dice.type in diceCounts) {
      diceCounts[dice.type] += 1;
    } else {
      diceCounts[dice.type] = 1;
    }
  }

  return (
    <Flex sx={{ justifyContent: "center", flexWrap: "wrap", width: "100%" }}>
      <DiceButton
        title="Add D20"
        count={diceCounts.d20}
        onClick={() => onDiceAdd(SunsetDice, "d20")}
      >
        <D20Icon />
      </DiceButton>
      <DiceButton
        title="Add D12"
        count={diceCounts.d12}
        onClick={() => onDiceAdd(SunsetDice, "d12")}
      >
        <D12Icon />
      </DiceButton>
      <DiceButton
        title="Add D10"
        count={diceCounts.d10}
        onClick={() => onDiceAdd(SunsetDice, "d10")}
      >
        <D10Icon />
      </DiceButton>
      <DiceButton
        title="Add D8"
        count={diceCounts.d8}
        onClick={() => onDiceAdd(SunsetDice, "d8")}
      >
        <D8Icon />
      </DiceButton>
      <DiceButton
        title="Add D6"
        count={diceCounts.d6}
        onClick={() => onDiceAdd(SunsetDice, "d6")}
      >
        <D6Icon />
      </DiceButton>
      <DiceButton
        title="Add D4"
        count={diceCounts.d4}
        onClick={() => onDiceAdd(SunsetDice, "d4")}
      >
        <D4Icon />
      </DiceButton>
      <DiceButton
        title="Add D100"
        count={diceCounts.d100}
        onClick={() => onDiceAdd(SunsetDice, "d100")}
      >
        <D100Icon />
      </DiceButton>
    </Flex>
  );
}

export default DiceButtons;

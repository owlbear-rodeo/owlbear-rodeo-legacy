import React, { useState, useEffect } from "react";
import { Flex, IconButton } from "theme-ui";

import D20Icon from "../../icons/D20Icon";
import D12Icon from "../../icons/D12Icon";
import D10Icon from "../../icons/D10Icon";
import D8Icon from "../../icons/D8Icon";
import D6Icon from "../../icons/D6Icon";
import D4Icon from "../../icons/D4Icon";
import D100Icon from "../../icons/D100Icon";
import ExpandMoreDiceTrayIcon from "../../icons/ExpandMoreDiceTrayIcon";

import DiceButton from "./DiceButton";
import SelectDiceButton from "./SelectDiceButton";

import Divider from "../Divider";

import { dice } from "../../dice";

function DiceButtons({
  diceRolls,
  onDiceAdd,
  onDiceLoad,
  diceTraySize,
  onDiceTraySizeChange,
}) {
  const [currentDice, setCurrentDice] = useState(dice[0]);

  useEffect(() => {
    const initialDice = dice[0];
    onDiceLoad(initialDice);
    setCurrentDice(initialDice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diceCounts = {};
  for (let dice of diceRolls) {
    if (dice.type in diceCounts) {
      diceCounts[dice.type] += 1;
    } else {
      diceCounts[dice.type] = 1;
    }
  }

  async function handleDiceChange(dice) {
    await onDiceLoad(dice);
    setCurrentDice(dice);
  }

  return (
    <Flex
      sx={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        borderRadius: "4px",
      }}
      p={2}
      bg="overlay"
    >
      <SelectDiceButton
        onDiceChange={handleDiceChange}
        currentDice={currentDice}
      />
      <Divider />
      <DiceButton
        title="Add D20"
        count={diceCounts.d20}
        onClick={() => onDiceAdd(currentDice.class, "d20")}
      >
        <D20Icon />
      </DiceButton>
      <DiceButton
        title="Add D12"
        count={diceCounts.d12}
        onClick={() => onDiceAdd(currentDice.class, "d12")}
      >
        <D12Icon />
      </DiceButton>
      <DiceButton
        title="Add D10"
        count={diceCounts.d10}
        onClick={() => onDiceAdd(currentDice.class, "d10")}
      >
        <D10Icon />
      </DiceButton>
      <DiceButton
        title="Add D8"
        count={diceCounts.d8}
        onClick={() => onDiceAdd(currentDice.class, "d8")}
      >
        <D8Icon />
      </DiceButton>
      <DiceButton
        title="Add D6"
        count={diceCounts.d6}
        onClick={() => onDiceAdd(currentDice.class, "d6")}
      >
        <D6Icon />
      </DiceButton>
      <DiceButton
        title="Add D4"
        count={diceCounts.d4}
        onClick={() => onDiceAdd(currentDice.class, "d4")}
      >
        <D4Icon />
      </DiceButton>
      <DiceButton
        title="Add D100"
        count={diceCounts.d100}
        onClick={() => onDiceAdd(currentDice.class, "d100")}
      >
        <D100Icon />
      </DiceButton>
      <Divider />
      <IconButton
        aria-label={
          diceTraySize === "single" ? "Expand Dice Tray" : "Shrink Dice Tray"
        }
        title={
          diceTraySize === "single" ? "Expand Dice Tray" : "Shrink Dice Tray"
        }
        sx={{
          transform: diceTraySize === "single" ? "rotate(0)" : "rotate(180deg)",
        }}
        onClick={() =>
          onDiceTraySizeChange(diceTraySize === "single" ? "double" : "single")
        }
      >
        <ExpandMoreDiceTrayIcon />
      </IconButton>
    </Flex>
  );
}

export default DiceButtons;

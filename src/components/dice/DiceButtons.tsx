import { useState, useEffect } from "react";
import { Flex, IconButton, Box } from "theme-ui";
import SimpleBar from "simplebar-react";

import D20Icon from "../../icons/D20Icon";
import D12Icon from "../../icons/D12Icon";
import D10Icon from "../../icons/D10Icon";
import D8Icon from "../../icons/D8Icon";
import D6Icon from "../../icons/D6Icon";
import D4Icon from "../../icons/D4Icon";
import D100Icon from "../../icons/D100Icon";
import ExpandMoreDiceTrayIcon from "../../icons/ExpandMoreDiceTrayIcon";
import ShareDiceOnIcon from "../../icons/ShareDiceOnIcon";
import ShareDiceOffIcon from "../../icons/ShareDiceOffIcon";

import DiceButton from "./DiceButton";
import SelectDiceButton from "./SelectDiceButton";

import Divider from "../Divider";

import Dice from "../../dice/Dice";

import { dice } from "../../dice";
import useSetting from "../../hooks/useSetting";

import { DefaultDice, DiceRoll, DiceType } from "../../types/Dice";
import { DiceShareChangeEventHandler } from "../../types/Events";

type DiceButtonsProps = {
  diceRolls: DiceRoll[];
  onDiceAdd: (style: typeof Dice, type: DiceType) => void;
  onDiceLoad: (dice: DefaultDice) => void;
  diceTraySize: "single" | "double";
  onDiceTraySizeChange: (newSize: "single" | "double") => void;
  shareDice: boolean;
  onShareDiceChange: DiceShareChangeEventHandler;
  loading: boolean;
};

function DiceButtons({
  diceRolls,
  onDiceAdd,
  onDiceLoad,
  diceTraySize,
  onDiceTraySizeChange,
  shareDice,
  onShareDiceChange,
  loading,
}: DiceButtonsProps) {
  const [currentDiceStyle, setCurrentDiceStyle] = useSetting("dice.style");
  const [currentDice, setCurrentDice] = useState<DefaultDice>(
    dice.find((d) => d.key === currentDiceStyle) || dice[0]
  );

  useEffect(() => {
    const initialDice = dice.find((d) => d.key === currentDiceStyle);
    if (initialDice) {
      onDiceLoad(initialDice);
      setCurrentDice(initialDice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diceCounts: Partial<Record<DiceType, number>> = {};
  for (let dice of diceRolls) {
    if (dice.type in diceCounts) {
      // TODO: Check type
      diceCounts[dice.type]! += 1;
    } else {
      diceCounts[dice.type] = 1;
    }
  }

  async function handleDiceChange(dice: DefaultDice) {
    await onDiceLoad(dice);
    setCurrentDice(dice);
    setCurrentDiceStyle(dice.key);
  }

  let buttons = [
    {
      key: "d20",
      title: "Add D20",
      count: diceCounts.d20,
      onClick: () => onDiceAdd(currentDice.class, "d20"),
      children: <D20Icon />,
    },
    {
      key: "d12",
      title: "Add D12",
      count: diceCounts.d12,
      onClick: () => onDiceAdd(currentDice.class, "d12"),
      children: <D12Icon />,
    },
    {
      key: "d10",
      title: "Add D10",
      count: diceCounts.d10,
      onClick: () => onDiceAdd(currentDice.class, "d10"),
      children: <D10Icon />,
    },
    {
      key: "d8",
      title: "Add D8",
      count: diceCounts.d8,
      onClick: () => onDiceAdd(currentDice.class, "d8"),
      children: <D8Icon />,
    },
    {
      key: "d6",
      title: "Add D6",
      count: diceCounts.d6,
      onClick: () => onDiceAdd(currentDice.class, "d6"),
      children: <D6Icon />,
    },
    {
      key: "d4",
      title: "Add D4",
      count: diceCounts.d4,
      onClick: () => onDiceAdd(currentDice.class, "d4"),
      children: <D4Icon />,
    },
    {
      key: "d100",
      title: "Add D100",
      count: diceCounts.d100,
      onClick: () => onDiceAdd(currentDice.class, "d100"),
      children: <D100Icon />,
    },
  ];

  return (
    <Box
      sx={{
        borderRadius: "4px",
        position: "absolute",
        top: "0",
        left: "0",
        height: "100%",
        maxHeight: "390px",
        pointerEvents: "all",
      }}
      bg="overlay"
    >
      <SimpleBar style={{ width: "48px", height: "100%" }}>
        <Flex
          sx={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
          p={2}
        >
          <SelectDiceButton
            onDiceChange={handleDiceChange}
            currentDice={currentDice}
            disabled={loading}
          />
          <Divider />
          {buttons.map((button) => (
            <DiceButton disabled={loading} {...button} />
          ))}
          <Divider />
          <IconButton
            aria-label={
              diceTraySize === "single"
                ? "Expand Dice Tray"
                : "Shrink Dice Tray"
            }
            title={
              diceTraySize === "single"
                ? "Expand Dice Tray"
                : "Shrink Dice Tray"
            }
            sx={{
              transform:
                diceTraySize === "single" ? "rotate(0)" : "rotate(180deg)",
            }}
            onClick={() =>
              onDiceTraySizeChange(
                diceTraySize === "single" ? "double" : "single"
              )
            }
            disabled={loading}
          >
            <ExpandMoreDiceTrayIcon />
          </IconButton>
          <Divider />
          <IconButton
            aria-label={shareDice ? "Hide Dice Rolls" : "Share Dice Rolls"}
            title={shareDice ? "Hide Dice Rolls" : "Share Dice Rolls"}
            onClick={() => onShareDiceChange(!shareDice)}
            disabled={loading}
          >
            {shareDice ? <ShareDiceOnIcon /> : <ShareDiceOffIcon />}
          </IconButton>
        </Flex>
      </SimpleBar>
    </Box>
  );
}

export default DiceButtons;

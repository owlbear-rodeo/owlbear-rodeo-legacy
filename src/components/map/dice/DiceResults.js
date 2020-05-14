import React, { useState } from "react";
import { Flex, Text, Button, IconButton } from "theme-ui";

import ClearDiceIcon from "../../../icons/ClearDiceIcon";
import RerollDiceIcon from "../../../icons/RerollDiceIcon";

const maxDiceRollsShown = 6;

function DiceResults({ diceRolls, onDiceClear, onDiceReroll }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (
    diceRolls.map((dice) => dice.roll).includes("unknown") ||
    diceRolls.length === 0
  ) {
    return null;
  }

  let rolls = [];
  if (diceRolls.length > 1) {
    rolls = diceRolls.map((dice, index) => (
      <React.Fragment key={index}>
        <Text variant="body2" as="p" color="hsl(210, 50%, 96%)">
          {dice.roll}
        </Text>
        <Text variant="body2" as="p" color="grey">
          {index === diceRolls.length - 1 ? "" : "+"}
        </Text>
      </React.Fragment>
    ));
  }

  return (
    <Flex
      sx={{
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <IconButton
        ml="24px"
        title="Clear Dice"
        aria-label="Clear Dice"
        onClick={onDiceClear}
      >
        <ClearDiceIcon />
      </IconButton>
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          variant="heading"
          as="h1"
          sx={{ fontSize: 5 }}
          mb={diceRolls.length === 1 ? "24px" : 0}
        >
          {diceRolls.reduce((accumulator, dice) => accumulator + dice.roll, 0)}
        </Text>
        {rolls.length > maxDiceRollsShown ? (
          <Button
            aria-label={"Show Dice Details"}
            title={"Show Dice Details"}
            onClick={() => setIsExpanded(!isExpanded)}
            variant="secondary"
            sx={{ display: "flex", height: "24px" }}
          >
            {isExpanded ? rolls : rolls.slice(0, maxDiceRollsShown)}
            {!isExpanded && (
              <Text variant="body2" as="p" color="hsl(210, 50%, 96%)">
                ...
              </Text>
            )}
          </Button>
        ) : (
          <Flex>{rolls}</Flex>
        )}
      </Flex>
      <IconButton
        mr="24px"
        title="Reroll Dice"
        aria-label="Reroll Dice"
        onClick={onDiceReroll}
      >
        <RerollDiceIcon />
      </IconButton>
    </Flex>
  );
}

export default DiceResults;

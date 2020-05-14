import React, { useState } from "react";
import { Flex, Text, Button } from "theme-ui";

const maxDiceRollsShown = 6;

function DiceResults({ diceRolls }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (diceRolls.includes("unknown") || diceRolls.length === 0) {
    return null;
  }

  let rolls = [];
  if (diceRolls.length > 1) {
    rolls = diceRolls.map((roll, index) => (
      <React.Fragment key={index}>
        <Text variant="body2" as="p" color="hsl(210, 50%, 96%)">
          {roll}
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
        {diceRolls.reduce((a, b) => a + b)}
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
  );
}

export default DiceResults;

import React from "react";
import { Flex } from "theme-ui";
import SimpleBar from "simplebar-react";
import { useMedia } from "react-media";

import DiceTile from "./DiceTile";

function DiceTiles({ dice, onDiceSelect, selectedDice, onDone }) {
  const isSmallScreen = useMedia({ query: "(max-width: 500px)" });

  return (
    <SimpleBar style={{ maxHeight: "300px" }}>
      <Flex
        p={2}
        bg="muted"
        sx={{
          flexWrap: "wrap",
          borderRadius: "4px",
          justifyContent: "space-between",
        }}
      >
        {dice.map((dice) => (
          <DiceTile
            key={dice.key}
            dice={dice}
            isSelected={selectedDice && dice.key === selectedDice.key}
            onDiceSelect={onDiceSelect}
            onDone={onDone}
            large={isSmallScreen}
          />
        ))}
      </Flex>
    </SimpleBar>
  );
}

export default DiceTiles;

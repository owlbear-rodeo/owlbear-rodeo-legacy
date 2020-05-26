import React from "react";
import { Flex } from "theme-ui";
import SimpleBar from "simplebar-react";

import DiceTile from "./DiceTile";

function DiceTiles({ dice, onDiceSelect, selectedDice, onDone }) {
  return (
    <SimpleBar style={{ maxHeight: "300px", width: "500px" }}>
      <Flex
        py={2}
        bg="muted"
        sx={{
          flexWrap: "wrap",
          width: "500px",
          borderRadius: "4px",
        }}
      >
        {dice.map((dice) => (
          <DiceTile
            key={dice.key}
            dice={dice}
            isSelected={selectedDice && dice.key === selectedDice.key}
            onDiceSelect={onDiceSelect}
            onDone={onDone}
          />
        ))}
      </Flex>
    </SimpleBar>
  );
}

export default DiceTiles;

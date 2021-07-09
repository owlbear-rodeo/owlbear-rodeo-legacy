import { Grid } from "theme-ui";
import SimpleBar from "simplebar-react";

import DiceTile from "./DiceTile";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";
import { DefaultDice } from "../../types/Dice";

type DiceTileProps = {
  dice: DefaultDice[];
  onDiceSelect: (dice: DefaultDice) => void;
  selectedDice: DefaultDice;
  onDone: (dice: DefaultDice) => void;
};

function DiceTiles({
  dice,
  onDiceSelect,
  selectedDice,
  onDone,
}: DiceTileProps) {
  const layout = useResponsiveLayout();

  return (
    <SimpleBar style={{ height: layout.tileContainerHeight }}>
      <Grid
        p={2}
        pb={4}
        bg="muted"
        sx={{
          borderRadius: "4px",
          minHeight: layout.screenSize === "large" ? "600px" : "400px",
        }}
        gap={2}
        columns={`repeat(${layout.tileGridColumns}, 1fr)`}
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
      </Grid>
    </SimpleBar>
  );
}

export default DiceTiles;

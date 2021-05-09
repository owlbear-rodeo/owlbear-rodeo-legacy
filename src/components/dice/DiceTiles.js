import React from "react";
import { Grid } from "theme-ui";
import SimpleBar from "simplebar-react";

import DiceTile from "./DiceTile";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

function DiceTiles({ dice, onDiceSelect, selectedDice, onDone }) {
  const layout = useResponsiveLayout();

  return (
    <SimpleBar
      style={{ height: layout.screenSize === "large" ? "600px" : "400px" }}
    >
      <Grid
        p={2}
        pb={4}
        bg="muted"
        sx={{
          borderRadius: "4px",
          minHeight: layout.screenSize === "large" ? "600px" : "400px",
        }}
        gap={2}
        columns={layout.gridTemplate}
      >
        {dice.map((dice) => (
          <DiceTile
            key={dice.key}
            dice={dice}
            isSelected={selectedDice && dice.key === selectedDice.key}
            onDiceSelect={onDiceSelect}
            onDone={onDone}
            size={layout.tileSize}
          />
        ))}
      </Grid>
    </SimpleBar>
  );
}

export default DiceTiles;

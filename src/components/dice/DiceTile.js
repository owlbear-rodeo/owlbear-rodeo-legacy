import React from "react";

import Tile from "../Tile";

function DiceTile({ dice, isSelected, onDiceSelect, onDone }) {
  return (
    <Tile
      src={dice.preview}
      title={dice.name}
      isSelected={isSelected}
      onSelect={() => onDiceSelect(dice)}
      onDoubleClick={() => onDone(dice)}
    />
  );
}

export default DiceTile;

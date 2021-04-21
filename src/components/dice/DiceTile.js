import React from "react";

import Tile from "../Tile";

function DiceTile({ dice, isSelected, onDiceSelect, onDone, size }) {
  return (
    <Tile
      src={dice.preview}
      title={dice.name}
      isSelected={isSelected}
      onSelect={() => onDiceSelect(dice)}
      onDoubleClick={() => onDone(dice)}
      size={size}
    />
  );
}

export default DiceTile;

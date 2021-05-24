import React from "react";
import { Image } from "theme-ui";

import Tile from "../tile/Tile";

function DiceTile({ dice, isSelected, onDiceSelect, onDone }) {
  return (
    <Tile
      title={dice.name}
      isSelected={isSelected}
      onSelect={() => onDiceSelect(dice)}
      onDoubleClick={() => onDone(dice)}
    >
      <Image src={dice.preview}></Image>
    </Tile>
  );
}

export default DiceTile;

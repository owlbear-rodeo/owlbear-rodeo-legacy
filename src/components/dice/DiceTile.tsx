import { Image } from "theme-ui";

import Tile from "../tile/Tile";

import { DefaultDice } from "../../types/Dice";

type DiceTileProps = {
  dice: DefaultDice;
  isSelected: boolean;
  onDiceSelect: (dice: DefaultDice) => void;
  onDone: (dice: DefaultDice) => void;
};

function DiceTile({ dice, isSelected, onDiceSelect, onDone }: DiceTileProps) {
  return (
    <div style={{ cursor: "pointer" }}>
      <Tile
        title={dice.name}
        isSelected={isSelected}
        onSelect={() => onDiceSelect(dice)}
        onDoubleClick={() => onDone(dice)}
      >
        <Image src={dice.preview}></Image>
      </Tile>
    </div>
  );
}

export default DiceTile;

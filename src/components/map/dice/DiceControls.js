import React from "react";
import { Flex, IconButton } from "theme-ui";

import ColorDice from "../../../dice/color/ColorDice";
import GemStoneDice from "../../../dice/gemStone/GemStoneDice";
import GlassDice from "../../../dice/glass/GlassDice";
import MetalDice from "../../../dice/metal/MetalDice";
import MetalStoneDice from "../../../dice/metalStone/MetalStoneDice";
import WoodDice from "../../../dice/wood/WoodDice";

import D20Icon from "../../../icons/D20Icon";
import D12Icon from "../../../icons/D12Icon";
import D10Icon from "../../../icons/D10Icon";
import D8Icon from "../../../icons/D8Icon";
import D6Icon from "../../../icons/D6Icon";
import D4Icon from "../../../icons/D4Icon";

function DiceControls({ onDiceAdd }) {
  return (
    <Flex>
      <IconButton
        title="Add D20"
        aria-label="Add D20"
        onClick={() => onDiceAdd(ColorDice, "d20")}
      >
        <D20Icon />
      </IconButton>
      <IconButton title="Add D12" aria-label="Add D12">
        <D12Icon />
      </IconButton>
      <IconButton title="Add D10" aria-label="Add D10">
        <D10Icon />
      </IconButton>
      <IconButton title="Add D8" aria-label="Add D8">
        <D8Icon />
      </IconButton>
      <IconButton title="Add D6" aria-label="Add D6">
        <D6Icon />
      </IconButton>
      <IconButton title="Add D4" aria-label="Add D4">
        <D4Icon />
      </IconButton>
    </Flex>
  );
}

export default DiceControls;

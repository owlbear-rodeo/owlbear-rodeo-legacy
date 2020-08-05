import React from "react";

import DiceButtons from "./DiceButtons";
import DiceResults from "./DiceResults";

function DiceControls({
  onDiceAdd,
  onDiceClear,
  onDiceReroll,
  onDiceLoad,
  diceTraySize,
  onDiceTraySizeChange,
  shareDice,
  onShareDiceChage,
  diceRolls,
  onDiceRollsChange,
}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: 0,
          right: 0,
          display: "flex",
          color: "white",
          pointerEvents: "none",
          transform: "translateX(50px)",
        }}
      >
        <DiceResults
          diceRolls={diceRolls}
          onDiceClear={() => {
            onDiceClear();
            onDiceRollsChange([]);
          }}
          onDiceReroll={onDiceReroll}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
        }}
      >
        <DiceButtons
          diceRolls={diceRolls}
          onDiceAdd={(style, type) => {
            onDiceAdd(style, type);
            onDiceRollsChange([...diceRolls, { type, roll: "unknown" }]);
          }}
          onDiceLoad={onDiceLoad}
          onDiceTraySizeChange={onDiceTraySizeChange}
          diceTraySize={diceTraySize}
          shareDice={shareDice}
          onShareDiceChange={onShareDiceChage}
        />
      </div>
    </>
  );
}

export default DiceControls;

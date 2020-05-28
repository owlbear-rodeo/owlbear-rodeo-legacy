import React, { useEffect, useState } from "react";
import * as BABYLON from "babylonjs";

import DiceButtons from "./DiceButtons";
import DiceResults from "./DiceResults";

function DiceControls({
  diceRefs,
  sceneVisibleRef,
  onDiceAdd,
  onDiceClear,
  onDiceReroll,
  onDiceLoad,
  diceTraySize,
  onDiceTraySizeChange,
}) {
  const [diceRolls, setDiceRolls] = useState([]);

  // Update dice rolls
  useEffect(() => {
    // Find the number facing up on a dice object
    function getDiceRoll(dice) {
      let number = getDiceInstanceRoll(dice.instance);
      // If the dice is a d100 add the d10
      if (dice.type === "d100") {
        const d10Number = getDiceInstanceRoll(dice.d10Instance);
        // Both zero set to 100
        if (d10Number === 0 && number === 0) {
          number = 100;
        } else {
          number += d10Number;
        }
      } else if (dice.type === "d10" && number === 0) {
        number = 10;
      }
      return { type: dice.type, roll: number };
    }

    // Find the number facing up on a mesh instance of a dice
    function getDiceInstanceRoll(instance) {
      let highestDot = -1;
      let highestLocator;
      for (let locator of instance.getChildTransformNodes()) {
        let dif = locator
          .getAbsolutePosition()
          .subtract(instance.getAbsolutePosition());
        let direction = dif.normalize();
        const dot = BABYLON.Vector3.Dot(direction, BABYLON.Vector3.Up());
        if (dot > highestDot) {
          highestDot = dot;
          highestLocator = locator;
        }
      }
      return parseInt(highestLocator.name.slice(12));
    }

    function updateDiceRolls() {
      const die = diceRefs.current;
      const sceneVisible = sceneVisibleRef.current;
      if (!sceneVisible) {
        return;
      }
      const diceAwake = die.map((dice) => dice.asleep).includes(false);
      if (!diceAwake) {
        return;
      }

      let newRolls = [];
      for (let i = 0; i < die.length; i++) {
        const dice = die[i];
        let roll = getDiceRoll(dice);
        newRolls[i] = roll;
      }
      setDiceRolls(newRolls);
    }

    const updateInterval = setInterval(updateDiceRolls, 100);
    return () => {
      clearInterval(updateInterval);
    };
  }, [diceRefs, sceneVisibleRef]);

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
        }}
      >
        <DiceResults
          diceRolls={diceRolls}
          onDiceClear={() => {
            onDiceClear();
            setDiceRolls([]);
          }}
          onDiceReroll={onDiceReroll}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: "24px",
          width: "100%",
        }}
      >
        <DiceButtons
          diceRolls={diceRolls}
          onDiceAdd={(style, type) => {
            onDiceAdd(style, type);
            setDiceRolls((prevRolls) => [
              ...prevRolls,
              { type, roll: "unknown" },
            ]);
          }}
          onDiceLoad={onDiceLoad}
          onDiceTraySizeChange={onDiceTraySizeChange}
          diceTraySize={diceTraySize}
        />
      </div>
    </>
  );
}

export default DiceControls;

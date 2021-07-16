import { InstancedMesh, TransformNode } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math";

import { DiceMesh, DiceRoll } from "../types/Dice";

/**
 * Find the number facing up on a mesh instance of a dice
 * @param {Object} instance The dice instance
 */
export function getDiceInstanceRoll(instance: InstancedMesh) {
  let highestDot = -1;
  let highestLocator: TransformNode | undefined = undefined;
  for (let locator of instance.getChildTransformNodes()) {
    let dif = locator
      .getAbsolutePosition()
      .subtract(instance.getAbsolutePosition());
    let direction = dif.normalize();
    const dot = Vector3.Dot(direction, Vector3.Up());
    if (dot > highestDot) {
      highestDot = dot;
      highestLocator = locator;
    }
  }
  if (!highestLocator) {
    return 0;
  }
  return parseInt(highestLocator.name.slice(12));
}

/**
 * Find the number facing up on a dice object
 */
export function getDiceRoll(dice: DiceMesh) {
  let number = getDiceInstanceRoll(dice.instance);
  // If the dice is a d100 add the d10
  if (dice.d10Instance) {
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

export function getDiceRollTotal(diceRolls: DiceRoll[]) {
  return diceRolls.reduce((accumulator: number, dice) => {
    if (dice.roll === "unknown") {
      return accumulator;
    } else {
      return accumulator + dice.roll;
    }
  }, 0);
}

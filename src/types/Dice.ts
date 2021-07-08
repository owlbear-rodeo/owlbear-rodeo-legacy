import { InstancedMesh } from "@babylonjs/core";

export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export type DiceRoll = {
  type: DiceType;
  roll: number | "unknown";
};

export type Dice = {
  type: DiceType;
  instance: InstancedMesh;
  asleep: boolean;
  d10Instance?: InstancedMesh;
};

export type DiceState = {
  share: boolean;
  rolls: DiceRoll[];
};

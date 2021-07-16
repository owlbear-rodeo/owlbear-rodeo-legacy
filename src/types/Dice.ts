import { InstancedMesh, Mesh } from "@babylonjs/core";
import Dice from "../dice/Dice";

export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export type DiceRoll = {
  type: DiceType;
  roll: number | "unknown";
};

export type DiceMesh = {
  type: DiceType;
  instance: InstancedMesh;
  asleep: boolean;
  sleepTimeout?: NodeJS.Timeout;
  d10Instance?: InstancedMesh;
};

export type DiceState = {
  share: boolean;
  rolls: DiceRoll[];
};

export type DefaultDice = {
  key: string;
  name: string;
  class: typeof Dice;
  preview: string;
};

export type BaseDiceTextureSources = {
  albedo: string;
  normal: string;
  metalRoughness: string;
};

export type DiceMeshes = Record<DiceType, Mesh>;

export function isDiceMeshes(
  meshes: Partial<DiceMeshes>
): meshes is DiceMeshes {
  return (
    !!meshes.d4 &&
    !!meshes.d6 &&
    !!meshes.d8 &&
    !!meshes.d10 &&
    !!meshes.d12 &&
    !!meshes.d20 &&
    !!meshes.d100
  );
}

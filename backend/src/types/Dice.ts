

export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export type DiceRoll = {
  type: DiceType;
  roll: number | "unknown";
};

export type Dice = {
  share: boolean;
  rolls: DiceRoll[];
};

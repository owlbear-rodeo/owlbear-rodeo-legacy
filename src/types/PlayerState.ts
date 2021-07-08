import { Timer } from "./Timer";
import { DiceState } from "./Dice";

export type PlayerState = {
  nickname: string;
  timer?: Timer;
  dice: DiceState;
  sessionId?: string;
  userId?: string;
};

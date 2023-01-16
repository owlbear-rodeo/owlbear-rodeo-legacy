import { Vector2 } from "./Vector2";
import { Color } from "./Color";

export type Pointer = {
  position: Vector2;
  visible: boolean;
  id: string;
  color: Color;
  time: number;
};

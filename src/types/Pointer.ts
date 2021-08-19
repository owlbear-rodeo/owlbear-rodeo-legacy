import Vector2 from "../helpers/Vector2";
import { Color } from "../helpers/colors";

export type PointerToolSettings = {
  color: Color;
};

export type PointerState = {
  position: Vector2;
  visible: boolean;
  id: string;
  color: Color;
};

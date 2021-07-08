import Vector2 from "../helpers/Vector2";

export type PointerToolSettings = {
  color: string;
};

export type PointerState = {
  position: Vector2;
  visible: boolean;
  id: string;
  color: string;
};

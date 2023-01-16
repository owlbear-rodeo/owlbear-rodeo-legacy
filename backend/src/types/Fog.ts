import { Vector2 } from "./Vector2";
import { Color } from "./Color";

export type FogData = {
  points: Vector2[];
  holes: Vector2[][];
};

export type Fog = {
  color: Color;
  data: FogData;
  id: string;
  strokeWidth: number;
  type: "fog";
  visible: boolean;
};

export type FogState = Record<string, Fog>;

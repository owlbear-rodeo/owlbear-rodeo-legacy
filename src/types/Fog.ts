import Vector2 from "../helpers/Vector2";

export type FogToolType =
  | "polygon"
  | "rectangle"
  | "brush"
  | "toggle"
  | "remove";

export type FogToolSettings = {
  type: FogToolType;
  multilayer: boolean;
  preview: boolean;
  useFogCut: boolean;
};

export type FogData = {
  points: Vector2[];
  holes: Vector2[][];
};

export type Fog = {
  color: string;
  data: FogData;
  id: string;
  strokeWidth: number;
  type: "fog";
  visible: boolean;
};

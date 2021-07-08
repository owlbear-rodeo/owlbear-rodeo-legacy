import Vector2 from "../helpers/Vector2";

export type DrawingToolType =
  | "brush"
  | "paint"
  | "line"
  | "rectangle"
  | "circle"
  | "triangle"
  | "erase";

export type DrawingToolSettings = {
  type: DrawingToolType;
  color: string;
  useBlending: boolean;
};

export type PointsData = {
  points: Vector2[];
};

export type RectData = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CircleData = {
  x: number;
  y: number;
  radius: number;
};

export type BaseDrawing = {
  blend: boolean;
  color: string;
  id: string;
  strokeWidth: number;
};

export type BaseShape = BaseDrawing & {
  type: "shape";
};

export type Line = BaseShape & {
  shapeType: "line";
  data: PointsData;
};

export type Rectangle = BaseShape & {
  shapeType: "rectangle";
  data: RectData;
};

export type Circle = BaseShape & {
  shapeType: "circle";
  data: CircleData;
};

export type Triangle = BaseShape & {
  shapeType: "triangle";
  data: PointsData;
};

export type Shape = Line | Rectangle | Circle | Triangle;

export type Path = BaseDrawing & {
  type: "path";
  pathType: "fill" | "stroke";
  data: PointsData;
};

export type Drawing = Shape | Path;

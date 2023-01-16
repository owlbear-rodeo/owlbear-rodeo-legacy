import { Vector2 } from "./Vector2";
import { Color } from "./Color";

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

export type ShapeData = PointsData | RectData | CircleData;

export type BaseDrawing = {
  blend: boolean;
  color: Color;
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

export type ShapeType =
  | Line["shapeType"]
  | Rectangle["shapeType"]
  | Circle["shapeType"]
  | Triangle["shapeType"];

export type Shape = Line | Rectangle | Circle | Triangle;

export type Path = BaseDrawing & {
  type: "path";
  pathType: "fill" | "stroke";
  data: PointsData;
};

export type Drawing = Shape | Path;

export type DrawingState = Record<string, Drawing>;

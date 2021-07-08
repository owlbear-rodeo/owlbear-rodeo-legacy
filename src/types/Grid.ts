import Vector2 from "../helpers/Vector2";

export type GridInset = {
  topLeft: Vector2;
  bottomRight: Vector2;
};

export type GridMeasurementType =
  | "chebyshev"
  | "alternating"
  | "euclidean"
  | "manhattan";

export type GridMeasurement = {
  type: GridMeasurementType;
  scale: string;
};

export type GridType = "square" | "hexVertical" | "hexHorizontal";

export type Grid = {
  inset: GridInset;
  size: Vector2;
  type: GridType;
  measurement: GridMeasurement;
};

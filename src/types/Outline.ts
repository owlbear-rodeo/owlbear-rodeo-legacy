export type CircleOutline = {
  type: "circle";
  x: number;
  y: number;
  radius: number;
};

export type RectOutline = {
  type: "rect";
  width: number;
  height: number;
  x: number;
  y: number;
};

export type PathOutline = {
  type: "path";
  points: number[];
};

export type Outline = CircleOutline | RectOutline | PathOutline;

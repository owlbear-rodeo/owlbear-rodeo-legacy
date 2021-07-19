import Konva from "konva";
import { RectData, PointsData } from "./Drawing";

export type SelectToolType = "path" | "rectangle";

export type SelectToolSettings = {
  type: SelectToolType;
};

export type BaseSelection = {
  nodes: Konva.Node[];
};

export type RectSelection = BaseSelection & {
  data: RectData;
  type: "rectangle";
};

export type PathSelection = BaseSelection & {
  data: PointsData;
  type: "path";
};

export type Selection = RectSelection | PathSelection;

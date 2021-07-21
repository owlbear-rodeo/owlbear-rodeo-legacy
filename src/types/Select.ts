import { RectData, PointsData } from "./Drawing";

export type SelectToolType = "path" | "rectangle";

export type SelectToolSettings = {
  type: SelectToolType;
};

export type SelectionItemType = "token" | "note";

export type SelectionItem = {
  type: SelectionItemType;
  id: string;
};

export type BaseSelection = {
  items: SelectionItem[];
  x: number;
  y: number;
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

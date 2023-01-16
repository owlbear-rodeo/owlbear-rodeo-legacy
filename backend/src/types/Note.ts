import { Color } from "./Color";

export type Note = {
  id: string;
  color: Color;
  lastModified: number;
  lastModifiedBy: string;
  locked: boolean;
  size: number;
  text: string;
  textOnly: boolean;
  visible: boolean;
  x: number;
  y: number;
  rotation: number;
};

export type Notes = Record<string, Note>;

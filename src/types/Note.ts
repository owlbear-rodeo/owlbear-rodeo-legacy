import Konva from "konva";
import { Color } from "../helpers/colors";

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
};

export type NoteMenuOptions = {
  noteId: string;
  noteNode: Konva.Node;
};

export type NoteDraggingOptions = {
  dragging: boolean;
  noteId: string;
  noteGroup: Konva.Node;
};

export type Notes = Record<string, Note>;

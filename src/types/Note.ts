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
  rotation: number;
};

export type NoteMenuOptions = {
  noteId: string;
  noteNode: Konva.Node;
};

export type NoteDraggingOptions = {
  dragging: boolean;
  noteId: string;
};

export type Notes = Record<string, Note>;

import Konva from "konva";
import { DefaultDice } from "./Dice";
import { Map } from "./Map";
import { MapState } from "./MapState";
import { Note } from "./Note";
import { TokenState } from "./TokenState";

export type MapChangeEventHandler = (map?: Map, mapState?: MapState) => void;
export type MapResetEventHandler = (newState: MapState) => void;
export type MapSettingsChangeEventHandler = (change: Partial<Map>) => void;
export type MapStateSettingsChangeEventHandler = (
  change: Partial<MapState>
) => void;

export type DiceSelectEventHandler = (dice: DefaultDice) => void;

export type RequestCloseEventHandler = () => void;

export type MapTokensStateCreateHandler = (states: TokenState[]) => void;
export type MapTokenStateRemoveHandler = (state: TokenState) => void;

export type TokenStateChangeEventHandler = (
  changes: Record<string, Partial<TokenState>>
) => void;
export type TokenMenuOpenChangeEventHandler = (
  tokenStateId: string,
  tokenImage: Konva.Node
) => void;

export type NoteAddEventHander = (note: Note) => void;
export type NoteRemoveEventHander = (noteId: string) => void;
export type NoteChangeEventHandler = (change: Partial<Note>) => void;
export type NoteMenuOpenEventHandler = (
  noteId: string,
  noteNode: Konva.Node
) => void;
export type NoteDragEventHandler = (
  event: Konva.KonvaEventObject<DragEvent>,
  noteId: string
) => void;

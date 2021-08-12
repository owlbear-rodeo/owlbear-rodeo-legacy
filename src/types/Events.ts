import Konva from "konva";
import { DefaultDice, DiceRoll } from "./Dice";
import { Map } from "./Map";
import { MapState } from "./MapState";
import { Note } from "./Note";
import { Timer } from "./Timer";
import { Token } from "./Token";
import { TokenState } from "./TokenState";

export type MapChangeEventHandler = (
  map: Map | null,
  mapState: MapState | null
) => void;
export type MapResetEventHandler = (newState: MapState) => void;
export type MapSettingsChangeEventHandler = (change: Partial<Map>) => void;
export type MapStateSettingsChangeEventHandler = (
  change: Partial<MapState>
) => void;

export type DiceSelectEventHandler = (dice: DefaultDice) => void;

export type RequestCloseEventHandler = () => void;

export type TokensStateCreateHandler = (states: TokenState[]) => void;
export type TokenStateRemoveHandler = (tokenStateIds: string[]) => void;
export type TokenStateChangeEventHandler = (
  changes: Record<string, Partial<TokenState>>
) => void;
export type TokenMenuOpenChangeEventHandler = (
  tokenStateId: string,
  tokenImage: Konva.Node,
  focus: boolean
) => void;
export type TokenMenuCloseChangeEventHandler = () => void;
export type TokenSettingsChangeEventHandler = (change: Partial<Token>) => void;
export type TokenDragEventHandler = (
  event: Konva.KonvaEventObject<DragEvent>,
  tokenStateId: string,
  attachedTokenStateIds: string[]
) => void;

export type NoteCreateEventHander = (notes: Note[]) => void;
export type NoteRemoveEventHander = (noteIds: string[]) => void;
export type NoteChangeEventHandler = (
  changes: Record<string, Partial<Note>>
) => void;
export type NoteMenuOpenEventHandler = (
  noteId: string,
  noteNode: Konva.Node,
  focus: boolean
) => void;
export type NoteMenuCloseEventHandler = () => void;
export type NoteDragEventHandler = (
  event: Konva.KonvaEventObject<DragEvent>,
  noteId: string
) => void;

export type DiceShareChangeEventHandler = (share: boolean) => void;
export type DiceRollsChangeEventHandler = (newRolls: DiceRoll[]) => void;

export type StreamStartEventHandler = (stream: MediaStream) => void;
export type StreamEndEventHandler = (stream: MediaStream) => void;

export type TimerStartEventHandler = (event: Timer) => void;
export type TimerStopEventHandler = () => void;

export type SelectionItemsChangeEventHandler = (
  tokenChanges: Record<string, Partial<TokenState>>,
  noteChanges: Record<string, Partial<Note>>
) => void;
export type SelectionItemsRemoveEventHandler = (
  tokenStateIds: string[],
  noteIds: string[]
) => void;
export type SelectionItemsCreateEventHandler = (
  tokenStates: TokenState[],
  notes: Note[]
) => void;

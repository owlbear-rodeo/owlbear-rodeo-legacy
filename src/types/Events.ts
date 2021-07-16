import Konva from "konva";
import { DefaultDice } from "./Dice";
import { Map } from "./Map";
import { MapState } from "./MapState";
import { TokenState } from "./TokenState";

export type MapChangeEventHandler = (map?: Map, mapState?: MapState) => void;

export type MapResetEventHandler = (newState: MapState) => void;

export type DiceSelectEventHandler = (dice: DefaultDice) => void;

export type RequestCloseEventHandler = () => void;

export type MapTokensStateCreateHandler = (states: TokenState[]) => void;

export type TokenStateChangeEventHandler = (
  change: Partial<Record<string, Partial<TokenState>>>
) => void;
export type TokenMenuOpenChangeEventHandler = (
  tokenStateId: string,
  tokenImage: Konva.Node
) => void;

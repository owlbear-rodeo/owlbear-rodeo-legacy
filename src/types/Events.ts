import { DefaultDice } from "./Dice";
import { Map } from "./Map";
import { MapState } from "./MapState";
import { TokenState } from "./TokenState";

export type MapChangeEventHandler = (map?: Map, mapState?: MapState) => void;

export type MapResetEventHandler = (newState: MapState) => void;

export type DiceSelectEventHandler = (dice: DefaultDice) => void;

export type RequestCloseEventHandler = () => void;

export type MapTokensStateCreateHandler = (states: TokenState[]) => void;

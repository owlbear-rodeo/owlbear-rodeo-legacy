import React from "react";
import Action from "../actions/Action";
import { DrawingState } from "./Drawing";
import { FogState } from "./Fog";
import { Grid } from "./Grid";
import { Notes } from "./Note";
import { TokenStates } from "./TokenState";

export type MapToolId =
  | "map"
  | "move"
  | "select"
  | "fog"
  | "drawing"
  | "measure"
  | "pointer"
  | "note";

export type MapTool = {
  id: MapToolId;
  icon: React.ReactNode;
  title: string;
  SettingsComponent?: React.ElementType;
};

export type BaseMap = {
  id: string;
  name: string;
  owner: string;
  grid: Grid;
  width: number;
  height: number;
  type: string;
  lastModified: number;
  created: number;
  showGrid: boolean;
  snapToGrid: boolean;
};

export type DefaultMap = BaseMap & {
  type: "default";
  key: string;
};

export type FileMapResolutions = {
  low?: string;
  medium?: string;
  high?: string;
  ultra?: string;
};

export type MapQuality = keyof FileMapResolutions | "original";

export type FileMap = BaseMap & {
  type: "file";
  file: string;
  resolutions: FileMapResolutions;
  thumbnail: string;
  quality: MapQuality;
};

export type Map = DefaultMap | FileMap;

export type DrawingsAction = {
  type: "drawings";
  action: Action<DrawingState>;
};
export type FogsAction = { type: "fogs"; action: Action<FogState> };
export type TokensAction = { type: "tokens"; action: Action<TokenStates> };
export type NotesAction = { type: "notes"; action: Action<Notes> };

export type MapAction =
  | DrawingsAction
  | FogsAction
  | TokensAction
  | NotesAction;

export type MapActions = {
  actions: MapAction[][];
  actionIndex: number;
};

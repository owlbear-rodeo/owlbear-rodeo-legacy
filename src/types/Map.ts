import React from "react";
import Action from "../actions/Action";
import { DrawingState } from "./Drawing";
import { FogState } from "./Fog";
import { Grid } from "./Grid";

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

export type MapActions = {
  mapDrawActions: Action<DrawingState>[];
  mapDrawActionIndex: number;
  fogDrawActions: Action<FogState>[];
  fogDrawActionIndex: number;
};

export type MapActionsKey = keyof Pick<
  MapActions,
  "mapDrawActions" | "fogDrawActions"
>;
export type MapActionsIndexKey = keyof Pick<
  MapActions,
  "mapDrawActionIndex" | "fogDrawActionIndex"
>;

import React from "react";
import { Grid } from "./Grid";

export type MapToolId =
  | "move"
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

export type FileMap = BaseMap & {
  type: "file";
  file: string;
  resolutions: FileMapResolutions;
  thumbnail: string;
  quality: keyof FileMapResolutions | "original";
};

export type Map = DefaultMap | FileMap;

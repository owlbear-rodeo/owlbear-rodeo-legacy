import { Outline } from "./Outline";

export type BaseTokenState = {
  id: string;
  tokenId: string;
  owner: string;
  size: number;
  category: string;
  label: string;
  statuses: string[];
  x: number;
  y: number;
  lastModifiedBy: string;
  lastModified: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  outline: Outline;
  width: number;
  height: number;
};

export type DefaultTokenState = BaseTokenState & {
  type: "default";
  key: string;
};

export type FileTokenState = BaseTokenState & {
  type: "file";
  file: string;
};

export type TokenState = DefaultTokenState | FileTokenState;

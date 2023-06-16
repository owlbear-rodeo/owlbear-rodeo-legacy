import { Color } from "./Color";
import { Outline } from "./Outline";
import { TokenCategory } from "./Token";

export type BaseTokenState = {
  id: string;
  tokenId: string;
  owner: string;
  size: number;
  category: TokenCategory;
  label: string;
  statuses: Color[];
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

export type TokenStates = Record<string, TokenState>;

import { Drawing } from "./Drawing";
import { Fog } from "./Fog";
import { Note } from "./Note";
import { TokenState } from "./TokenState";

export type EditFlag = "drawing" | "tokens" | "notes" | "fog";

export type MapState = {
  tokens: Record<string, TokenState>;
  drawShapes: Record<string, Drawing>;
  fogShapes: Record<string, Fog>;
  editFlags: Array<EditFlag>;
  notes: Record<string, Note>;
  mapId: string;
};

import { DrawingState } from "./Drawing";
import { FogState } from "./Fog";
import { Note } from "./Note";
import { TokenState } from "./TokenState";

export type EditFlag = "drawing" | "tokens" | "notes" | "fog";

export type MapState = {
  tokens: Record<string, TokenState>;
  drawShapes: DrawingState;
  fogShapes: FogState;
  editFlags: Array<EditFlag>;
  notes: Record<string, Note>;
  mapId: string;
};

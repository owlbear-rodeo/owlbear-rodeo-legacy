import Ajv from "ajv";
import { MapState } from "../types/MapState";

import { DrawingSchema } from "./Drawing";
import { FogSchema } from "./Fog";
import { NoteSchema } from "./Note";
import { TokenStateSchema } from "./TokenState";
import { Vector2Schema } from "./Vector2";
import { ColorSchema } from "./Color";
import { OutlineSchema } from "./Outline";

export const MapStateSchema: any = {
  $id: "https://www.owlbear.rodeo/schemas/map-state.json",
  properties: {
    tokens: {
      $ref: "#/definitions/TokenStates",
    },
    drawShapes: {
      $ref: "#/definitions/DrawingState",
    },
    fogShapes: {
      $ref: "#/definitions/FogState",
    },
    editFlags: {
      items: {
        enum: ["drawing", "fog", "notes", "tokens"],
        type: "string",
      },
      type: "array",
    },
    notes: {
      $ref: "#/definitions/Notes",
    },
    mapId: {
      type: "string",
    },
  },
  required: [
    "drawShapes",
    "editFlags",
    "fogShapes",
    "mapId",
    "notes",
    "tokens",
  ],
  type: "object",
  definitions: {
    TokenStates: {
      propertyNames: {
        type: "string",
      },
      additionalProperties: {
        $ref: "token-state.json",
      },
      required: [],
      type: "object",
    },
    DrawingState: {
      propertyNames: {
        type: "string",
      },
      additionalProperties: {
        $ref: "drawing.json",
      },
      required: [],
      type: "object",
    },
    FogState: {
      propertyNames: {
        type: "string",
      },
      additionalProperties: {
        $ref: "fog.json",
      },
      required: [],
      type: "object",
    },
    Notes: {
      propertyNames: {
        type: "string",
      },
      additionalProperties: {
        $ref: "note.json",
      },
      required: [],
      type: "object",
    },
  },
};

export const ajv = new Ajv({
  schemas: [
    MapStateSchema,
    DrawingSchema,
    FogSchema,
    NoteSchema,
    TokenStateSchema,
    Vector2Schema,
    ColorSchema,
    OutlineSchema,
  ],
});

export const isMapState = ajv.compile<MapState>(MapStateSchema);

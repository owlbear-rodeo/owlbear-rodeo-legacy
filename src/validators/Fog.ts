import Ajv from "ajv";
import { Fog } from "../types/Fog";

import { Vector2Schema } from "./Vector2";
import { ColorSchema } from "./Color";

export const FogSchema = {
  $id: "https://www.owlbear.rodeo/schemas/fog.json",
  properties: {
    color: {
      $ref: "color.json",
    },
    data: {
      $ref: "#/definitions/FogData",
    },
    id: {
      type: "string",
    },
    strokeWidth: {
      type: "number",
    },
    type: {
      enum: ["fog"],
      type: "string",
    },
    visible: {
      type: "boolean",
    },
  },
  required: ["color", "data", "id", "strokeWidth", "type", "visible"],
  type: "object",
  definitions: {
    FogData: {
      properties: {
        holes: {
          items: {
            items: {
              $ref: "vector2.json",
            },
            type: "array",
          },
          type: "array",
        },
        points: {
          items: {
            $ref: "vector2.json",
          },
          type: "array",
        },
      },
      required: ["holes", "points"],
      type: "object",
    },
  },
};

const ajv = new Ajv({ schemas: [FogSchema, ColorSchema, Vector2Schema] });

export const isFog = ajv.compile<Fog>(FogSchema);

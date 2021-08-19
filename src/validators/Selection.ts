import Ajv from "ajv";
import { Selection } from "../types/Select";

import { DrawingSchema } from "./Drawing";
import { Vector2Schema } from "./Vector2";
import { ColorSchema } from "./Color";

export const SelectionSchema = {
  $id: "https://www.owlbear.rodeo/schemas/selection.json",
  anyOf: [
    {
      $ref: "#/definitions/RectSelection",
    },
    {
      $ref: "#/definitions/PathSelection",
    },
  ],
  definitions: {
    SelectionItemType: {
      enum: ["token", "note"],
      type: "string",
    },
    SelectionItem: {
      properties: {
        type: {
          $ref: "#/definitions/SelectionItemType",
        },
        id: {
          type: "string",
        },
      },
      required: ["type", "id"],
      type: "object",
    },
    BaseSelection: {
      properties: {
        items: {
          items: {
            $ref: "#/definitions/SelectionItem",
          },
          type: "array",
        },
        x: {
          type: "number",
        },
        y: {
          type: "number",
        },
      },
      required: ["items", "x", "y"],
      type: "object",
    },
    RectSelection: {
      allOf: [
        {
          $ref: "#/definitions/BaseSelection",
        },
        {
          properties: {
            data: {
              $ref: "drawing.json#/definitions/RectData",
            },
            type: {
              enum: ["rectangle"],
              type: "string",
            },
          },
          required: ["data", "type"],
          type: "object",
        },
      ],
    },
    PathSelection: {
      allOf: [
        {
          $ref: "#/definitions/BaseSelection",
        },
        {
          properties: {
            data: {
              $ref: "drawing.json#/definitions/PointsData",
            },
            type: {
              enum: ["path"],
              type: "string",
            },
          },
          required: ["data", "type"],
          type: "object",
        },
      ],
    },
  },
};

const ajv = new Ajv({
  schemas: [SelectionSchema, DrawingSchema, Vector2Schema, ColorSchema],
});

export const isSelection = ajv.compile<Selection>(SelectionSchema);

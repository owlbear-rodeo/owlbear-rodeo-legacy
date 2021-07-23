import Ajv from "ajv";
import { Outline } from "../types/Outline";

const ajv = new Ajv();

export const OutlineSchema = {
  $id: "https://www.owlbear.rodeo/schemas/outline.json",
  anyOf: [
    {
      $ref: "#/definitions/CircleOutline",
    },
    {
      $ref: "#/definitions/RectOutline",
    },
    {
      $ref: "#/definitions/PathOutline",
    },
  ],
  definitions: {
    CircleOutline: {
      properties: {
        radius: {
          type: "number",
        },
        type: {
          enum: ["circle"],
          type: "string",
        },
        x: {
          type: "number",
        },
        y: {
          type: "number",
        },
      },
      required: ["radius", "type", "x", "y"],
      type: "object",
    },
    RectOutline: {
      properties: {
        height: {
          type: "number",
        },
        type: {
          enum: ["rect"],
          type: "string",
        },
        width: {
          type: "number",
        },
        x: {
          type: "number",
        },
        y: {
          type: "number",
        },
      },
      required: ["height", "type", "width", "x", "y"],
      type: "object",
    },
    PathOutline: {
      properties: {
        points: {
          items: {
            type: "number",
          },
          type: "array",
        },
        type: {
          enum: ["path"],
          type: "string",
        },
      },
      required: ["points", "type"],
      type: "object",
    },
  },
};

export const isColor = ajv.compile<Outline>(OutlineSchema);

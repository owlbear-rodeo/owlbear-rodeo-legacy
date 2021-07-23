import Ajv from "ajv";
import { Drawing } from "../types/Drawing";

import { ColorSchema } from "./Color";
import { Vector2Schema } from "./Vector2";

export const DrawingSchema = {
  $id: "https://www.owlbear.rodeo/schemas/drawing.json",
  anyOf: [
    {
      $ref: "#/definitions/Shape",
    },
    {
      $ref: "#/definitions/Path",
    },
  ],
  definitions: {
    PointsData: {
      properties: {
        points: {
          items: {
            $ref: "vector2.json",
          },
          type: "array",
        },
      },
      required: ["points"],
      type: "object",
    },
    RectData: {
      properties: {
        height: {
          type: "number",
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
      required: ["height", "width", "x", "y"],
      type: "object",
    },
    CircleData: {
      properties: {
        radius: {
          type: "number",
        },
        x: {
          type: "number",
        },
        y: {
          type: "number",
        },
      },
      required: ["radius", "x", "y"],
      type: "object",
    },
    BaseDrawing: {
      properties: {
        blend: {
          type: "boolean",
        },
        color: {
          $ref: "color.json",
        },
        id: {
          type: "string",
        },
        strokeWidth: {
          type: "number",
        },
      },
      required: ["blend", "color", "id", "strokeWidth"],
      type: "object",
    },
    BaseShape: {
      allOf: [
        {
          $ref: "#/definitions/BaseDrawing",
        },
        {
          properties: {
            type: {
              enum: ["shape"],
              type: "string",
            },
          },
          required: ["type"],
          type: "object",
        },
      ],
    },
    Line: {
      allOf: [
        {
          $ref: "#/definitions/BaseShape",
        },
        {
          properties: {
            data: {
              $ref: "#/definitions/PointsData",
            },
            shapeType: {
              enum: ["line"],
              type: "string",
            },
          },
          required: ["data", "shapeType"],
          type: "object",
        },
      ],
    },
    Rectangle: {
      allOf: [
        {
          $ref: "#/definitions/BaseShape",
        },
        {
          properties: {
            data: {
              $ref: "#/definitions/RectData",
            },
            shapeType: {
              enum: ["rectangle"],
              type: "string",
            },
          },
          required: ["data", "shapeType"],
          type: "object",
        },
      ],
    },
    Circle: {
      allOf: [
        {
          $ref: "#/definitions/BaseShape",
        },
        {
          properties: {
            data: {
              $ref: "#/definitions/CircleData",
            },
            shapeType: {
              enum: ["circle"],
              type: "string",
            },
          },
          required: ["data", "shapeType"],
          type: "object",
        },
      ],
    },
    Triangle: {
      allOf: [
        {
          $ref: "#/definitions/BaseShape",
        },
        {
          properties: {
            data: {
              $ref: "#/definitions/PointsData",
            },
            shapeType: {
              enum: ["triangle"],
              type: "string",
            },
          },
          required: ["data", "shapeType"],
          type: "object",
        },
      ],
    },
    Shape: {
      anyOf: [
        {
          $ref: "#/definitions/Line",
        },
        {
          $ref: "#/definitions/Rectangle",
        },
        {
          $ref: "#/definitions/Circle",
        },
        {
          $ref: "#/definitions/Triangle",
        },
      ],
    },
    Path: {
      allOf: [
        {
          $ref: "#/definitions/BaseDrawing",
        },
        {
          properties: {
            data: {
              $ref: "#/definitions/PointsData",
            },
            pathType: {
              enum: ["fill", "stroke"],
              type: "string",
            },
            type: {
              enum: ["path"],
              type: "string",
            },
          },
          required: ["data", "pathType", "type"],
          type: "object",
        },
      ],
    },
  },
};

export const ajv = new Ajv({
  schemas: [DrawingSchema, ColorSchema, Vector2Schema],
});

export const isDrawing = ajv.compile<Drawing>(DrawingSchema);

import Ajv, { JSONSchemaType } from "ajv";
import { Note } from "../types/Note";

import { Vector2Schema } from "./Vector2";
import { ColorSchema } from "./Color";

export const NoteSchema: JSONSchemaType<Note> = {
  $id: "https://www.owlbear.rodeo/schemas/note.json",
  properties: {
    color: {
      $ref: "color.json",
    },
    id: {
      type: "string",
    },
    lastModified: {
      type: "number",
    },
    lastModifiedBy: {
      type: "string",
    },
    locked: {
      type: "boolean",
    },
    size: {
      type: "number",
    },
    text: {
      type: "string",
    },
    textOnly: {
      type: "boolean",
    },
    visible: {
      type: "boolean",
    },
    x: {
      type: "number",
    },
    y: {
      type: "number",
    },
    rotation: {
      type: "number",
    },
  },
  required: [
    "color",
    "id",
    "lastModified",
    "lastModifiedBy",
    "locked",
    "size",
    "text",
    "textOnly",
    "visible",
    "x",
    "y",
    "rotation",
  ],
  type: "object",
};

const ajv = new Ajv({ schemas: [NoteSchema, ColorSchema, Vector2Schema] });

export const isNote = ajv.compile<Note>(NoteSchema);

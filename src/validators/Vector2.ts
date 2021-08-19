import Ajv, { JSONSchemaType } from "ajv";
import Vector2 from "../helpers/Vector2";

const ajv = new Ajv();

export const Vector2Schema: JSONSchemaType<Vector2> = {
  $id: "https://www.owlbear.rodeo/schemas/vector2.json",
  properties: {
    x: {
      type: "number",
    },
    y: {
      type: "number",
    },
  },
  required: ["x", "y"],
  type: "object",
};

export const isVector2 = ajv.compile<Vector2>(Vector2Schema);

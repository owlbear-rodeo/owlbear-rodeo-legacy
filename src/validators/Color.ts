import Ajv, { JSONSchemaType } from "ajv";
import { Color } from "../helpers/colors";

const ajv = new Ajv();

export const ColorSchema: JSONSchemaType<Color> = {
  $id: "https://www.owlbear.rodeo/schemas/color.json",
  enum: [
    "black",
    "blue",
    "darkGray",
    "green",
    "lightGray",
    "orange",
    "pink",
    "primary",
    "purple",
    "red",
    "teal",
    "white",
    "yellow",
  ],
  type: "string",
};

export const isColor = ajv.compile<Color>(ColorSchema);

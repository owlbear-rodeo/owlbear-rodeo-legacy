import Case from "case";

import blankImage from "./Blank Grid 22x22.jpg";
import grassImage from "./Grass Grid 22x22.jpg";
import sandImage from "./Sand Grid 22x22.jpg";
import stoneImage from "./Stone Grid 22x22.jpg";
import waterImage from "./Water Grid 22x22.jpg";
import woodImage from "./Wood Grid 22x22.jpg";

import unknownImage from "./Unknown Grid 22x22.jpg";

export const mapSources = {
  blank: blankImage,
  grass: grassImage,
  sand: sandImage,
  stone: stoneImage,
  water: waterImage,
  wood: woodImage,
};

export const maps = Object.keys(mapSources).map((key) => ({
  key,
  name: Case.capital(key),
  grid: {
    size: { x: 22, y: 22 },
    scale: { x: 1, y: 1 },
    offset: { x: 0, y: 0 },
    type: "square",
  },
  width: 1024,
  height: 1024,
  type: "default",
}));

export const unknownSource = unknownImage;

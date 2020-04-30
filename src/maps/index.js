import blankImage from "./Blank Grid 22x22.jpg";
import grassImage from "./Grass Grid 22x22.jpg";
import sandImage from "./Sand Grid 22x22.jpg";
import stoneImage from "./Stone Grid 22x22.jpg";
import waterImage from "./Water Grid 22x22.jpg";
import woodImage from "./Wood Grid 22x22.jpg";

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
  name: key.charAt(0).toUpperCase() + key.slice(1),
  gridX: 22,
  gridY: 22,
  width: 1024,
  height: 1024,
  type: "default",
}));

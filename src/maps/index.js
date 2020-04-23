import blankImage from "./Blank Grid 22x22.jpg";
import grassImage from "./Grass Grid 22x22.jpg";
import sandImage from "./Sand Grid 22x22.jpg";
import stoneImage from "./Stone Grid 22x22.jpg";
import waterImage from "./Water Grid 22x22.jpg";
import woodImage from "./Wood Grid 22x22.jpg";

const defaultProps = {
  gridX: 22,
  gridY: 22,
  width: 1024,
  height: 1024,
  default: true,
};

export const blank = {
  ...defaultProps,
  source: blankImage,
  id: "__default_blank",
};

export const grass = {
  ...defaultProps,
  source: grassImage,
  id: "__default_grass",
};

export const sand = {
  ...defaultProps,
  source: sandImage,
  id: "__default_sand",
};

export const stone = {
  ...defaultProps,
  source: stoneImage,
  id: "__default_stone",
};

export const water = {
  ...defaultProps,
  source: waterImage,
  id: "__default_water",
};

export const wood = {
  ...defaultProps,
  source: woodImage,
  id: "__default_wood",
};

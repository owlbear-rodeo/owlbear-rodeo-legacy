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

export function getDefaultMaps(userId) {
  const mapKeys = Object.keys(mapSources);
  let maps = [];
  let mapStates = [];
  for (let i = 0; i < mapKeys.length; i++) {
    const key = mapKeys[i];
    const name = Case.capital(key);
    const id = `__default-${name}`;
    const map = {
      id,
      key,
      name,
      owner: userId,
      grid: {
        size: { x: 22, y: 22 },
        inset: { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: 1 } },
        type: "square",
        measurement: { type: "chebyshev", scale: "5ft" },
      },
      width: 1024,
      height: 1024,
      type: "default",
      created: mapKeys.length - i,
      lastModified: Date.now(),
      showGrid: false,
      snapToGrid: true,
      group: "",
    };
    maps.push(map);
    const state = {
      mapId: id,
      tokens: {},
      drawShapes: {},
      fogShapes: {},
      editFlags: ["drawing", "tokens", "notes"],
      notes: {},
    };
    mapStates.push(state);
  }
  return { maps, mapStates };
}

export const unknownSource = unknownImage;

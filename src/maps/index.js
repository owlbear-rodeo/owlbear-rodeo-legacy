import Case from "case";

import blankImage from "./Blank.jpg";
import grassImage from "./Grass.jpg";
import sandImage from "./Sand.jpg";
import stoneImage from "./Stone.jpg";
import waterImage from "./Water.jpg";
import woodImage from "./Wood.jpg";

import unknownImage from "./Unknown.jpg";

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
      showGrid: key !== "stone",
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

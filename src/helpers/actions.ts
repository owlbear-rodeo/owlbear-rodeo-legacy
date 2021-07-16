import { MultiPolygon, Ring, Polygon, Geom } from "polygon-clipping";
import shortid from "shortid";
import { Fog, FogState } from "../types/Fog";

export function addPolygonDifferenceToFog(
  fog: Fog,
  difference: MultiPolygon,
  shapes: FogState
) {
  for (let i = 0; i < difference.length; i++) {
    let newId = shortid.generate();
    // Holes detected
    let holes = [];
    if (difference[i].length > 1) {
      for (let j = 1; j < difference[i].length; j++) {
        holes.push(
          difference[i][j].map(([x, y]: [x: number, y: number]) => ({ x, y }))
        );
      }
    }

    const points = difference[i][0].map(([x, y]: [x: number, y: number]) => ({
      x,
      y,
    }));

    shapes[newId] = {
      ...fog,
      id: newId,
      data: {
        points,
        holes,
      },
    };
  }
}

export function addPolygonIntersectionToFog(
  shape: Fog,
  intersection: MultiPolygon,
  shapes: FogState
) {
  for (let i = 0; i < intersection.length; i++) {
    let newId = shortid.generate();

    const points = intersection[i][0].map(([x, y]: [x: number, y: number]) => ({
      x,
      y,
    }));

    shapes[newId] = {
      ...shape,
      id: newId,
      data: {
        points,
        holes: [],
      },
      // Default intersection visibility to false
      visible: false,
    };
  }
}

export function fogToGeometry(fog: Fog): Geom {
  const shapePoints: Ring = fog.data.points.map(({ x, y }) => [x, y]);
  const shapeHoles: Polygon = fog.data.holes.map((hole) =>
    hole.map(({ x, y }) => [x, y])
  );
  return [[shapePoints, ...shapeHoles]];
}

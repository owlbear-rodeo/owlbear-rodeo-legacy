import { Selection } from "../types/Select";
import Vector2 from "./Vector2";

export function getSelectionPoints(selection: Selection): Vector2[] {
  let points: Vector2[] = [];
  if (selection.type === "path") {
    points = selection.data.points;
  } else {
    points.push({ x: selection.data.x, y: selection.data.y });
    points.push({
      x: selection.data.x + selection.data.width,
      y: selection.data.y,
    });
    points.push({
      x: selection.data.x + selection.data.width,
      y: selection.data.y + selection.data.height,
    });
    points.push({
      x: selection.data.x,
      y: selection.data.y + selection.data.height,
    });
  }
  return points;
}

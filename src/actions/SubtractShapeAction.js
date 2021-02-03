import polygonClipping from "polygon-clipping";

import Action from "./Action";
import { addPolygonDifferenceToShapes } from "../helpers/drawing";

class SubtractShapeAction extends Action {
  constructor(shapes) {
    super();
    this.update = (shapesById) => {
      const actionGeom = shapes.map((actionShape) => [
        actionShape.data.points.map(({ x, y }) => [x, y]),
      ]);
      let subtractedShapes = {};
      for (let shape of Object.values(shapesById)) {
        const shapePoints = shape.data.points.map(({ x, y }) => [x, y]);
        const shapeHoles = shape.data.holes.map((hole) =>
          hole.map(({ x, y }) => [x, y])
        );
        let shapeGeom = [[shapePoints, ...shapeHoles]];
        try {
          const difference = polygonClipping.difference(shapeGeom, actionGeom);
          addPolygonDifferenceToShapes(shape, difference, subtractedShapes);
        } catch {
          console.error("Unable to find difference for shapes");
        }
      }
      return subtractedShapes;
    };
  }
}

export default SubtractShapeAction;

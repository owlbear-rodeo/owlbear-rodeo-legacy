import polygonClipping from "polygon-clipping";

import Action from "./Action";
import {
  addPolygonDifferenceToShapes,
  addPolygonIntersectionToShapes,
} from "../helpers/actions";

class CutShapeAction extends Action {
  constructor(shapes) {
    super();
    this.update = (shapesById) => {
      const actionGeom = shapes.map((actionShape) => [
        actionShape.data.points.map(({ x, y }) => [x, y]),
      ]);
      let cutShapes = {};
      for (let shape of Object.values(shapesById)) {
        const shapePoints = shape.data.points.map(({ x, y }) => [x, y]);
        const shapeHoles = shape.data.holes.map((hole) =>
          hole.map(({ x, y }) => [x, y])
        );
        let shapeGeom = [[shapePoints, ...shapeHoles]];
        try {
          const difference = polygonClipping.difference(shapeGeom, actionGeom);
          const intersection = polygonClipping.intersection(
            shapeGeom,
            actionGeom
          );
          addPolygonDifferenceToShapes(shape, difference, cutShapes);
          addPolygonIntersectionToShapes(shape, intersection, cutShapes);
        } catch {
          console.error("Unable to find intersection for shapes");
        }
      }
      return cutShapes;
    };
  }
}

export default CutShapeAction;

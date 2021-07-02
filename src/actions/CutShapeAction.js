import polygonClipping from "polygon-clipping";

import Action from "./Action";
import {
  addPolygonDifferenceToShapes,
  addPolygonIntersectionToShapes,
  shapeToGeometry,
} from "../helpers/actions";

class CutShapeAction extends Action {
  constructor(shapes) {
    super();
    this.update = (shapesById) => {
      let actionGeom = shapes.map(shapeToGeometry);
      let cutShapes = {};
      for (let shape of Object.values(shapesById)) {
        const shapeGeom = shapeToGeometry(shape);
        try {
          const difference = polygonClipping.difference(
            shapeGeom,
            ...actionGeom
          );
          const intersection = polygonClipping.intersection(
            shapeGeom,
            ...actionGeom
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

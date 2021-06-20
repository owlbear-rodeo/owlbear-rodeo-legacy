import polygonClipping from "polygon-clipping";

import Action from "./Action";
import {
  addPolygonDifferenceToShapes,
  shapeToGeometry,
} from "../helpers/actions";

class SubtractShapeAction extends Action {
  constructor(shapes) {
    super();
    this.update = (shapesById) => {
      const actionGeom = shapes.map(shapeToGeometry);
      let subtractedShapes = {};
      for (let shape of Object.values(shapesById)) {
        const shapeGeom = shapeToGeometry(shape);
        try {
          const difference = polygonClipping.difference(
            shapeGeom,
            ...actionGeom
          );
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

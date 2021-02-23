import Action from "./Action";
import { omit } from "../helpers/shared";

class RemoveShapeAction extends Action {
  constructor(shapeIds) {
    super();
    this.update = (shapesById) => {
      return omit(shapesById, shapeIds);
    };
  }
}

export default RemoveShapeAction;

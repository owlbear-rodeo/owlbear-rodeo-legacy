import Action from "./Action";

class AddShapeAction extends Action {
  constructor(shapes) {
    super();
    this.update = (shapesById) => {
      for (let shape of shapes) {
        shapesById[shape.id] = shape;
      }
      return shapesById;
    };
  }
}

export default AddShapeAction;

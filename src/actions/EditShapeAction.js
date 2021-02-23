import Action from "./Action";

class EditShapeAction extends Action {
  constructor(shapes) {
    super();
    this.update = (shapesById) => {
      for (let edit of shapes) {
        if (edit.id in shapesById) {
          shapesById[edit.id] = { ...shapesById[edit.id], ...edit };
        }
      }
      return shapesById;
    };
  }
}

export default EditShapeAction;

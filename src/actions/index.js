import AddShapeAction from "./AddShapeAction";
import CutShapeAction from "./CutShapeAction";
import EditShapeAction from "./EditShapeAction";
import RemoveShapeAction from "./RemoveShapeAction";
import SubtractShapeAction from "./SubtractShapeAction";

/**
 * Convert from the previous representation of actions (1.7.0) to the new representation (1.8.0)
 * and combine into shapes
 * @param {Array} actions
 * @param {number} actionIndex
 */
export function convertOldActionsToShapes(actions, actionIndex) {
  let newShapes = {};
  for (let i = 0; i <= actionIndex; i++) {
    const action = actions[i];
    if (!action) {
      continue;
    }
    let newAction;
    if (action.shapes) {
      if (action.type === "add") {
        newAction = new AddShapeAction(action.shapes);
      } else if (action.type === "edit") {
        newAction = new EditShapeAction(action.shapes);
      } else if (action.type === "remove") {
        newAction = new RemoveShapeAction(action.shapes);
      } else if (action.type === "subtract") {
        newAction = new SubtractShapeAction(action.shapes);
      } else if (action.type === "cut") {
        newAction = new CutShapeAction(action.shapes);
      }
    } else if (action.type === "remove" && action.shapeIds) {
      newAction = new RemoveShapeAction(action.shapeIds);
    }

    if (newAction) {
      newShapes = newAction.execute(newShapes);
    }
  }
  return newShapes;
}

export {
  AddShapeAction,
  CutShapeAction,
  EditShapeAction,
  RemoveShapeAction,
  SubtractShapeAction,
};

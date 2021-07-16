import Action from "./Action";

import { ID } from "../types/Action";

class EditStatesAction<State extends ID> extends Action<Record<string, State>> {
  edits: Partial<State>[];

  constructor(edits: Partial<State>[]) {
    super();
    this.edits = edits;
  }

  update(statesById: Record<string, State>) {
    for (let edit of this.edits) {
      if (edit.id !== undefined && edit.id in statesById) {
        statesById[edit.id] = { ...statesById[edit.id], ...edit };
      }
    }
    return statesById;
  }
}

export default EditStatesAction;

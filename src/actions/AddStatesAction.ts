import Action from "./Action";

import { ID } from "../types/Action";

class AddStatesAction<State extends ID> extends Action<Record<string, State>> {
  states: State[];

  constructor(states: State[]) {
    super();
    this.states = states;
  }

  update(statesById: Record<string, State>) {
    for (let state of this.states) {
      statesById[state.id] = state;
    }
    return statesById;
  }
}

export default AddStatesAction;

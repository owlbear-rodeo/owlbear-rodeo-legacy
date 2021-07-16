import { Diff } from "deep-diff";

import { diff, revertChanges } from "../helpers/diff";
import cloneDeep from "lodash.clonedeep";

/**
 * Implementation of the Command Pattern
 * Wraps an update function with internal state to support undo
 */
class Action<State> {
  /**
   * The update function called with the current state and should return the updated state
   * This is implemented in the child class
   */
  update(state: State): State {
    return state;
  }

  /**
   * The changes caused by the last state update
   */
  changes: Diff<State, State>[] | undefined;

  /**
   * Executes the action update on the state
   * @param {State} state The current state to update
   */
  execute(state: State): State {
    if (state && this.update) {
      let newState = this.update(cloneDeep(state));
      this.changes = diff(state, newState);
      return newState;
    }
    return state;
  }

  /**
   * Reverts the changes caused by the last call of `execute`
   * @param {State} state The current state to perform the undo on
   * @returns {State} The state with the last changes reverted
   */
  undo(state: State): State {
    if (state && this.changes) {
      let revertedState = cloneDeep(state);
      revertChanges(revertedState, this.changes);
      return revertedState;
    }
    return state;
  }
}

export default Action;

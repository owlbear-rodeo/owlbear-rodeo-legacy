// Load Diff for auto complete
// eslint-disable-next-line no-unused-vars
import { Diff } from "deep-diff";

import { diff, revertChanges } from "../helpers/diff";
import cloneDeep from "lodash.clonedeep";

/**
 * @callback ActionUpdate
 * @param {any} state
 */

/**
 * Implementation of the Command Pattern
 * Wraps an update function with internal state to support undo
 */
class Action {
  /**
   * The update function called with the current state and should return the updated state
   * This is implemented in the child class
   *
   * @type {ActionUpdate}
   */
  update;

  /**
   * The changes caused by the last state update
   * @type {Diff}
   */
  changes;

  /**
   * Executes the action update on the state
   * @param {any} state The current state to update
   * @returns {any} The updated state
   */
  execute(state) {
    if (state && this.update) {
      let newState = this.update(cloneDeep(state));
      this.changes = diff(state, newState);
      return newState;
    }
    return state;
  }

  /**
   * Reverts the changes caused by the last call of `execute`
   * @param {any} state The current state to perform the undo on
   * @returns {any} The state with the last changes reverted
   */
  undo(state) {
    if (state && this.changes) {
      let revertedState = cloneDeep(state);
      revertChanges(revertedState, this.changes);
      return revertedState;
    }
    return state;
  }
}

export default Action;

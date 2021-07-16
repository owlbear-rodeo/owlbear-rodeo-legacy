import Action from "./Action";
import { omit } from "../helpers/shared";

import { ID } from "../types/Action";

class RemoveStatesAction<State extends ID> extends Action<
  Record<string, State>
> {
  stateIds: string[];

  constructor(stateIds: string[]) {
    super();
    this.stateIds = stateIds;
  }

  update(statesById: Record<string, State>) {
    return omit(statesById, this.stateIds);
  }
}

export default RemoveStatesAction;

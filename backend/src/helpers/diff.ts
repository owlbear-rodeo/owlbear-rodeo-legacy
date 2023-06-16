import diff, { Diff } from "deep-diff";
import get from "lodash.get";
const { applyChange } = diff;

export function applyChanges<LHS>(target: LHS, changes: Diff<LHS, any>[]) {
  for (let change of changes) {
    if (change.path && (change.kind === "E" || change.kind === "A")) {
      // If editing an object or array ensure that the value exists
      const valid = get(target, change.path) !== undefined;
      if (valid) {
        applyChange(target, true, change);
      }
    } else {
      applyChange(target, true, change);
    }
  }
}

export type Update<T> = {
  id: string;
  changes: Diff<T>[];
};

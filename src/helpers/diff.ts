import { applyChange, Diff, revertChange, diff as deepDiff }from "deep-diff";
import get from "lodash.get";

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

export function revertChanges<LHS>(target: LHS, changes: Diff<LHS, any>[]) {
  for (let change of changes) {
    revertChange(target, true, change);
  }
}

export const diff = deepDiff;

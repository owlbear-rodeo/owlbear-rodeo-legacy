import { applyChange, revertChange, diff as deepDiff } from "deep-diff";
import get from "lodash.get";

export function applyChanges(target, changes) {
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

export function revertChanges(target, changes) {
  for (let change of changes) {
    revertChange(target, true, change);
  }
}

export const diff = deepDiff;

import { applyChange, diff as deepDiff } from "deep-diff";

export function applyChanges(target, changes) {
  for (let change of changes) {
    applyChange(target, true, change);
  }
}

export const diff = deepDiff;

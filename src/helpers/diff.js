import { applyChange, revertChange, diff as deepDiff } from "deep-diff";

export function applyChanges(target, changes) {
  for (let change of changes) {
    applyChange(target, true, change);
  }
}

export function revertChanges(target, changes) {
  for (let change of changes) {
    revertChange(target, true, change);
  }
}

export const diff = deepDiff;

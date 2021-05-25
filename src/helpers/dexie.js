import set from "lodash.set";
import unset from "lodash.unset";
import cloneDeep from "lodash.clonedeep";

export function applyObservableChange(change) {
  // Custom application of dexie change to fix issue with array indices being wrong
  // https://github.com/dfahlander/Dexie.js/issues/1176
  // TODO: Fix dexie observable source
  let obj = cloneDeep(change.oldObj);
  const changes = Object.entries(change.mods).reverse();
  for (let [key, value] of changes) {
    if (value === null) {
      unset(obj, key);
    } else {
      obj = set(obj, key, value);
    }
  }
  return obj;
}

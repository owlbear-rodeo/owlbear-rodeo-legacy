import set from "lodash.set";
import unset from "lodash.unset";
import cloneDeep from "lodash.clonedeep";

/**
 * Remove all empty values from an object recursively
 * @param {Object} obj
 */
function trimArraysInObject(obj) {
  for (let key in obj) {
    const value = obj[key];
    if (Array.isArray(value)) {
      let arr = [];
      for (let i = 0; i < value.length; i++) {
        const el = value[i];
        if (typeof el === "object") {
          arr.push(trimArraysInObject(el));
        } else if (el !== undefined) {
          arr.push(el);
        }
      }
      obj[key] = arr;
    } else if (typeof obj[key] === "object") {
      obj[key] = trimArraysInObject(obj[key]);
    }
  }
  return obj;
}

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

  // Trim empty values from calling unset on arrays
  obj = trimArraysInObject(obj);

  return obj;
}

import { v4 as uuid } from "uuid";
import cloneDeep from "lodash.clonedeep";

import { keyBy } from "./shared";

/**
 * @typedef GroupItem
 * @property {string} id
 * @property {"item"} type
 */

/**
 * @typedef GroupContainer
 * @property {string} id
 * @property {"group"} type
 * @property {GroupItem[]} items
 * @property {string} name
 */

/**
 * @typedef {GroupItem|GroupContainer} Group
 */

/**
 * Transform an array of group ids to their groups
 * @param {string[]} groupIds
 * @param {Group[]} groups
 * @return {Group[[]}
 */
export function groupsFromIds(groupIds, groups) {
  const groupsByIds = keyBy(groups, "id");
  const filteredGroups = [];
  for (let groupId of groupIds) {
    filteredGroups.push(groupsByIds[groupId]);
  }
  return filteredGroups;
}

/**
 * Get all items from a group including all sub groups
 * @param {Group} group
 * @return {GroupItem[]}
 */
export function getGroupItems(group) {
  if (group.type === "group") {
    let groups = [];
    for (let item of group.items) {
      groups.push(...getGroupItems(item));
    }
    return groups;
  } else {
    return [group];
  }
}

/**
 * Transform an array of groups into their assosiated items
 * @param {Group[]} groups
 * @param {any[]} allItems
 * @param {string} itemKey
 * @returns {any[]}
 */
export function itemsFromGroups(groups, allItems, itemKey = "id") {
  const allItemsById = keyBy(allItems, itemKey);
  const groupedItems = [];

  for (let group of groups) {
    const groupItems = getGroupItems(group);
    const items = groupItems.map((item) => allItemsById[item.id]);
    groupedItems.push(...items);
  }

  return groupedItems;
}

/**
 * Combine two groups
 * @param {Group} a
 * @param {Group} b
 * @returns {GroupContainer}
 */
export function combineGroups(a, b) {
  if (a.type === "item") {
    return {
      id: uuid(),
      type: "group",
      items: [a, b],
      name: "",
    };
  }
  if (a.type === "group") {
    return {
      id: a.id,
      type: "group",
      items: [...a.items, b],
      name: a.name,
    };
  }
}

/**
 * Immutably move group at indices `from` into index `to`
 * @param {Group[]} groups
 * @param {number} to
 * @param {number[]} from
 * @returns {Group[]}
 */
export function moveGroups(groups, to, from) {
  const newGroups = cloneDeep(groups);

  const toGroup = newGroups[to];
  let fromGroups = [];
  for (let i of from) {
    fromGroups.push(newGroups[i]);
  }

  let combined = toGroup;
  for (let fromGroup of fromGroups) {
    combined = combineGroups(combined, fromGroup);
  }

  // Replace and remove old groups
  newGroups[to] = combined;
  for (let fromGroup of fromGroups) {
    const i = newGroups.findIndex((group) => group.id === fromGroup.id);
    newGroups.splice(i, 1);
  }

  return newGroups;
}

/**
 * Recursively find a group within a group array
 * @param {Group[]} groups
 * @param {string} groupId
 * @returns {Group}
 */
export function findGroup(groups, groupId) {
  for (let group of groups) {
    if (group.id === groupId) {
      return group;
    }
    const items = getGroupItems(group);
    for (let item of items) {
      if (item.id === groupId) {
        return item;
      }
    }
  }
}

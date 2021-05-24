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
 * Immutably move group at `bIndex` into `aIndex`
 * @param {Group[]} groups
 * @param {number} aIndex
 * @param {number} bIndex
 * @returns {Group[]}
 */
export function moveGroups(groups, aIndex, bIndex) {
  const aGroup = groups[aIndex];
  const bGroup = groups[bIndex];
  const newGroup = combineGroups(aGroup, bGroup);
  const newGroups = cloneDeep(groups);
  newGroups[aIndex] = newGroup;
  newGroups.splice(bIndex, 1);
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

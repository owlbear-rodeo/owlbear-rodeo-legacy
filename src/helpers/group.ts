import { v4 as uuid } from "uuid";
import cloneDeep from "lodash.clonedeep";

import { keyBy } from "./shared";
import { Group, GroupContainer, GroupItem } from "../types/Group";

/**
 * Transform an array of group ids to their groups
 */
export function groupsFromIds(groupIds: string[], groups: Group[]): Group[] {
  const groupsByIds = keyBy(groups, "id");
  const filteredGroups: Group[] = [];
  for (let groupId of groupIds) {
    if (groupId in groupsByIds) {
      filteredGroups.push(groupsByIds[groupId]);
    }
  }
  return filteredGroups;
}

/**
 * Get all items from a group including all sub groups
 */
export function getGroupItems(group: Group): GroupItem[] {
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
 */
export function itemsFromGroups<Item>(
  groups: Group[],
  allItems: Item[],
  itemKey = "id"
): Item[] {
  const allItemsById = keyBy(allItems, itemKey);
  const groupedItems: Item[] = [];

  for (let group of groups) {
    const groupItems = getGroupItems(group);
    const items = groupItems.map((item) => allItemsById[item.id]);
    groupedItems.push(...items);
  }

  return groupedItems;
}

/**
 * Combine a group and a group item
 */
export function combineGroups(a: Group, b: Group): GroupContainer {
  switch (a.type) {
    case "item":
      if (b.type !== "item") {
        throw new Error("Unable to combine two GroupContainers");
      }
      return {
        id: uuid(),
        type: "group",
        items: [a, b],
        name: "",
      };
    case "group":
      if (b.type !== "item") {
        throw new Error("Unable to combine two GroupContainers");
      }
      return {
        id: a.id,
        type: "group",
        items: [...a.items, b],
        name: a.name,
      };
    default:
      throw new Error("Group type not implemented");
  }
}

/**
 * Immutably move group at indices `indices` into group at index `into`
 */
export function moveGroupsInto(
  groups: Group[],
  into: number,
  indices: number[]
): Group[] {
  const newGroups = cloneDeep(groups);

  const intoGroup = newGroups[into];
  let fromGroups: Group[] = [];
  for (let i of indices) {
    fromGroups.push(newGroups[i]);
  }

  let combined: Group = intoGroup;
  for (let fromGroup of fromGroups) {
    combined = combineGroups(combined, fromGroup);
  }

  // Replace and remove old groups
  newGroups[into] = combined;
  for (let fromGroup of fromGroups) {
    const i = newGroups.findIndex((group) => group.id === fromGroup.id);
    newGroups.splice(i, 1);
  }

  return newGroups;
}

/**
 * Immutably move group at indices `indices` to index `to`
 */
export function moveGroups(
  groups: Group[],
  to: number,
  indices: number[]
): Group[] {
  const newGroups = cloneDeep(groups);

  let fromGroups = [];
  for (let i of indices) {
    fromGroups.push(newGroups[i]);
  }

  // Remove old groups
  for (let fromGroup of fromGroups) {
    const i = newGroups.findIndex((group) => group.id === fromGroup.id);
    newGroups.splice(i, 1);
  }

  // Add back at new index
  newGroups.splice(to, 0, ...fromGroups);

  return newGroups;
}

/**
 * Move items from a sub group to the start of the base group
 * @param fromId The id of the group to move from
 * @param indices The indices of the items in the group
 */
export function ungroup(groups: Group[], fromId: string, indices: number[]) {
  const newGroups = cloneDeep(groups);

  const fromIndex = newGroups.findIndex((group) => group.id === fromId);
  const from = newGroups[fromIndex];
  if (from.type !== "group") {
    throw new Error(`Unable to ungroup ${fromId}, not a group`);
  }

  let items: GroupItem[] = [];
  for (let i of indices) {
    items.push(from.items[i]);
  }

  // Remove items from previous group
  for (let item of items) {
    const i = from.items.findIndex((el) => el.id === item.id);
    from.items.splice(i, 1);
  }

  // If we have no more items in the group delete it
  if (from.items.length === 0) {
    newGroups.splice(fromIndex, 1);
  }

  // Add to base group
  newGroups.splice(0, 0, ...items);

  return newGroups;
}

/**
 * Recursively find a group within a group array
 */
export function findGroup(groups: Group[], groupId: string): Group | undefined {
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

/**
 * Transform and item array to a record of item ids to item names
 */
export function getItemNames<Item extends { name: string; id: string }>(
  items: Item[]
) {
  let names: Record<string, string> = {};
  for (let item of items) {
    names[item.id] = item.name;
  }
  return names;
}

/**
 * Immutably rename a group
 */
export function renameGroup(
  groups: Group[],
  groupId: string,
  newName: string
): Group[] {
  let newGroups = cloneDeep(groups);
  const groupIndex = newGroups.findIndex((group) => group.id === groupId);
  const group = groups[groupIndex];
  if (group.type !== "group") {
    throw new Error(`Unable to rename group ${groupId}, not of type group`);
  }
  if (groupIndex >= 0) {
    group.name = newName;
  }
  return newGroups;
}

/**
 * Remove items from groups including sub groups
 * @param {Group[]} groups
 * @param {string[]} itemIds
 */
export function removeGroupsItems(groups: Group[], itemIds: string[]): Group[] {
  let newGroups = cloneDeep(groups);

  for (let i = newGroups.length - 1; i >= 0; i--) {
    const group = newGroups[i];
    if (group.type === "item") {
      if (itemIds.includes(group.id)) {
        newGroups.splice(i, 1);
      }
    } else {
      const items = group.items;
      for (let j = items.length - 1; j >= 0; j--) {
        const item = items[j];
        if (itemIds.includes(item.id)) {
          group.items.splice(j, 1);
        }
      }
      // Remove group if no items are left
      if (group.items.length === 0) {
        newGroups.splice(i, 1);
      }
    }
  }

  return newGroups;
}

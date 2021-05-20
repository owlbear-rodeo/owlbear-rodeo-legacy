import { useEffect, useState } from "react";
import Fuse from "fuse.js";

import { groupBy, keyBy } from "./shared";

/**
 * Helpers for the SelectMapModal and SelectTokenModal
 */

// Helper for generating search results for items
export function useSearch(items, search) {
  const [filteredItems, setFilteredItems] = useState([]);
  const [filteredItemScores, setFilteredItemScores] = useState({});
  const [fuse, setFuse] = useState();

  // Update search index when items change
  useEffect(() => {
    setFuse(new Fuse(items, { keys: ["name", "group"], includeScore: true }));
  }, [items]);

  // Perform search when search changes
  useEffect(() => {
    if (search) {
      const query = fuse.search(search);
      setFilteredItems(query.map((result) => result.item));
      setFilteredItemScores(
        query.reduce(
          (acc, value) => ({ ...acc, [value.item.id]: value.score }),
          {}
        )
      );
    }
  }, [search, items, fuse]);

  return [filteredItems, filteredItemScores];
}

// TODO: Rework group support
// Helper for grouping items
export function useGroup(items, filteredItems, useFiltered, filteredScores) {
  const itemsByGroup = groupBy(useFiltered ? filteredItems : items, "group");
  // Get the groups of the items sorting by the average score if we're filtering or the alphabetical order
  // with "" at the start and "default" at the end if not
  let itemGroups = Object.keys(itemsByGroup);
  if (useFiltered) {
    itemGroups.sort((a, b) => {
      const aScore = itemsByGroup[a].reduce(
        (acc, item) => (acc + filteredScores[item.id]) / 2
      );
      const bScore = itemsByGroup[b].reduce(
        (acc, item) => (acc + filteredScores[item.id]) / 2
      );
      return aScore - bScore;
    });
  } else {
    itemGroups.sort((a, b) => {
      if (a === "" || b === "default") {
        return -1;
      }
      if (b === "" || a === "default") {
        return 1;
      }
      return a.localeCompare(b);
    });
  }
  return [itemsByGroup, itemGroups];
}

// Helper for handling selecting items
export function handleItemSelect(
  item,
  selectMode,
  selectedIds,
  setSelectedIds,
  itemsByGroup,
  itemGroups
) {
  if (!item) {
    setSelectedIds([]);
    return;
  }
  switch (selectMode) {
    case "single":
      setSelectedIds([item.id]);
      break;
    case "multiple":
      setSelectedIds((prev) => {
        if (prev.includes(item.id)) {
          return prev.filter((id) => id !== item.id);
        } else {
          return [...prev, item.id];
        }
      });
      break;
    case "range":
      /// TODO: Fix when new groups system is added
      return;
    // Create items array
    // let items = itemGroups.reduce(
    //   (acc, group) => [...acc, ...itemsByGroup[group]],
    //   []
    // );

    // // Add all items inbetween the previous selected item and the current selected
    // if (selectedIds.length > 0) {
    //   const mapIndex = items.findIndex((m) => m.id === item.id);
    //   const lastIndex = items.findIndex(
    //     (m) => m.id === selectedIds[selectedIds.length - 1]
    //   );
    //   let idsToAdd = [];
    //   let idsToRemove = [];
    //   const direction = mapIndex > lastIndex ? 1 : -1;
    //   for (
    //     let i = lastIndex + direction;
    //     direction < 0 ? i >= mapIndex : i <= mapIndex;
    //     i += direction
    //   ) {
    //     const itemId = items[i].id;
    //     if (selectedIds.includes(itemId)) {
    //       idsToRemove.push(itemId);
    //     } else {
    //       idsToAdd.push(itemId);
    //     }
    //   }
    //   setSelectedIds((prev) => {
    //     let ids = [...prev, ...idsToAdd];
    //     return ids.filter((id) => !idsToRemove.includes(id));
    //   });
    // } else {
    //   setSelectedIds([item.id]);
    // }
    // break;
    default:
      setSelectedIds([]);
  }
}

export function groupsFromIds(groupIds, groups) {
  const groupsByIds = keyBy(groups, "id");
  const filteredGroups = [];
  for (let groupId of groupIds) {
    filteredGroups.push(groupsByIds[groupId]);
  }
  return filteredGroups;
}

export function itemsFromGroups(
  groups,
  allItems,
  includeGroupedItems = true,
  itemKey = "id"
) {
  const allItemsById = keyBy(allItems, itemKey);
  const groupedItems = [];

  for (let group of groups) {
    if (group.type === "item") {
      groupedItems.push(allItemsById[group.id]);
    } else if (group.type === "group" && includeGroupedItems) {
      for (let item of group.items) {
        groupedItems.push(allItemsById[item.id]);
      }
    }
  }

  return groupedItems;
}

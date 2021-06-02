import { useEffect, useState } from "react";
import Fuse from "fuse.js";

import { groupBy } from "./shared";

/**
 * Helpers for the SelectMapModal and SelectTokenModal
 */

// Helper for generating search results for items
export function useSearch(items: any[], search: string) {
  // TODO: add types to search items -> don't like the never type
  const [filteredItems, setFilteredItems]: [
    filteredItems: any,
    setFilteredItems: any
  ] = useState([]);
  const [filteredItemScores, setFilteredItemScores]: [
    filteredItemScores: {},
    setFilteredItemScores: React.Dispatch<React.SetStateAction<{}>>
  ] = useState({});
  const [fuse, setFuse] = useState<any>();

  // Update search index when items change
  useEffect(() => {
    setFuse(new Fuse(items, { keys: ["name", "group"], includeScore: true }));
  }, [items]);

  // Perform search when search changes
  useEffect(() => {
    if (search) {
      const query = fuse?.search(search);
      setFilteredItems(query?.map((result: any) => result.item));
      let reduceResult: {} | undefined = query?.reduce(
        (acc: {}, value: any) => ({ ...acc, [value.item.id]: value.score }),
        {}
      );
      if (reduceResult) {
        setFilteredItemScores(reduceResult);
      }
    }
  }, [search, items, fuse]);

  return [filteredItems, filteredItemScores];
}

// Helper for grouping items
export function useGroup(
  items: any[],
  filteredItems: any[],
  useFiltered: boolean,
  filteredScores: any[]
) {
  const itemsByGroup = groupBy(useFiltered ? filteredItems : items, "group");
  // Get the groups of the items sorting by the average score if we're filtering or the alphabetical order
  // with "" at the start and "default" at the end if not
  let itemGroups = Object.keys(itemsByGroup);
  if (useFiltered) {
    itemGroups.sort((a, b) => {
      const aScore = itemsByGroup[a].reduce(
        (acc: any, item: any) => (acc + filteredScores[item.id]) / 2
      );
      const bScore = itemsByGroup[b].reduce(
        (acc: any, item: any) => (acc + filteredScores[item.id]) / 2
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
  item: any,
  selectMode: any,
  selectedIds: string[],
  setSelectedIds: any,
  itemsByGroup: any,
  itemGroups: any
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
      setSelectedIds((prev: any[]) => {
        if (prev.includes(item.id)) {
          return prev.filter((id: number) => id !== item.id);
        } else {
          return [...prev, item.id];
        }
      });
      break;
    case "range":
      // Create items array
      let items = itemGroups.reduce(
        (acc: [], group: any) => [...acc, ...itemsByGroup[group]],
        []
      );

      // Add all items inbetween the previous selected item and the current selected
      if (selectedIds.length > 0) {
        const mapIndex = items.findIndex((m: any) => m.id === item.id);
        const lastIndex = items.findIndex(
          (m: any) => m.id === selectedIds[selectedIds.length - 1]
        );
        let idsToAdd: string[] = [];
        let idsToRemove: string[] = [];
        const direction = mapIndex > lastIndex ? 1 : -1;
        for (
          let i = lastIndex + direction;
          direction < 0 ? i >= mapIndex : i <= mapIndex;
          i += direction
        ) {
          const itemId: string = items[i].id;
          if (selectedIds.includes(itemId)) {
            idsToRemove.push(itemId);
          } else {
            idsToAdd.push(itemId);
          }
        }
        setSelectedIds((prev: any[]) => {
          let ids = [...prev, ...idsToAdd];
          return ids.filter((id) => !idsToRemove.includes(id));
        });
      } else {
        setSelectedIds([item.id]);
      }
      break;
    default:
      setSelectedIds([]);
  }
}

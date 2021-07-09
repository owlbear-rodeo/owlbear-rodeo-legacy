import React, { useState, useContext, useEffect } from "react";
import cloneDeep from "lodash.clonedeep";
import Fuse from "fuse.js";

import { useKeyboard, useBlur } from "./KeyboardContext";

import { getGroupItems, groupsFromIds } from "../helpers/group";

import shortcuts from "../shortcuts";
import { Group, GroupContainer, GroupItem } from "../types/Group";

type GroupContext = {
  groups: Group[];
  activeGroups: Group[];
  openGroupId: string | undefined;
  openGroupItems: Group[];
  filter: string | undefined;
  filteredGroupItems: GroupItem[];
  selectedGroupIds: string[];
  selectMode: any;
  onSelectModeChange: React.Dispatch<
    React.SetStateAction<"single" | "multiple" | "range">
  >;
  onGroupOpen: (groupId: string) => void;
  onGroupClose: () => void;
  onGroupsChange: (
    newGroups: Group[] | GroupItem[],
    groupId: string | undefined
  ) => void;
  onGroupSelect: (groupId: string | undefined) => void;
  onFilterChange: React.Dispatch<React.SetStateAction<string | undefined>>;
};

const GroupContext = React.createContext<GroupContext | undefined>(undefined);

type GroupProviderProps = {
  groups: Group[];
  itemNames: Record<string, string>;
  onGroupsChange: (groups: Group[]) => void;
  onGroupsSelect: (groupIds: string[]) => void;
  disabled: boolean;
  children: React.ReactNode;
};

export function GroupProvider({
  groups,
  itemNames,
  onGroupsChange,
  onGroupsSelect,
  disabled,
  children,
}: GroupProviderProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  // Either single, multiple or range
  const [selectMode, setSelectMode] =
    useState<"single" | "multiple" | "range">("single");

  /**
   * Group Open
   */
  const [openGroupId, setOpenGroupId] = useState<string>();
  const [openGroupItems, setOpenGroupItems] = useState<Group[]>([]);
  useEffect(() => {
    if (openGroupId) {
      const openGroups = groupsFromIds([openGroupId], groups);
      if (openGroups.length === 1) {
        const openGroup = openGroups[0];
        setOpenGroupItems(getGroupItems(openGroup));
      } else {
        // Close group if we can't find it
        // This can happen if it was deleted or all it's items were deleted
        setOpenGroupItems([]);
        setOpenGroupId(undefined);
      }
    } else {
      setOpenGroupItems([]);
    }
  }, [openGroupId, groups]);

  function handleGroupOpen(groupId: string) {
    setSelectedGroupIds([]);
    setOpenGroupId(groupId);
  }

  function handleGroupClose() {
    setSelectedGroupIds([]);
    setOpenGroupId(undefined);
  }

  /**
   * Search
   */
  const [filter, setFilter] = useState<string>();
  const [filteredGroupItems, setFilteredGroupItems] = useState<GroupItem[]>([]);
  const [fuse, setFuse] = useState<Fuse<GroupItem & { name: string }>>();
  // Update search index when items change
  useEffect(() => {
    let items = [];
    for (let group of groups) {
      const itemsToAdd = getGroupItems(group);
      const namedItems = itemsToAdd.map((item) => ({
        ...item,
        name: itemNames[item.id],
      }));
      items.push(...namedItems);
    }
    setFuse(new Fuse(items, { keys: ["name"] }));
  }, [groups, itemNames]);

  // Perform search when search changes
  useEffect(() => {
    if (filter && fuse) {
      const query = fuse.search(filter);
      setFilteredGroupItems(query.map((result) => result.item));
      setOpenGroupId(undefined);
    } else {
      setFilteredGroupItems([]);
    }
  }, [filter, fuse]);

  /**
   * Handlers
   */

  const activeGroups = openGroupId
    ? openGroupItems
    : filter
    ? filteredGroupItems
    : groups;

  /**
   * @param {Group[] | GroupItem[]} newGroups
   * @param {string|undefined} groupId The group to apply changes to, leave undefined to replace the full group object
   */
  function handleGroupsChange(
    newGroups: Group[] | GroupItem[],
    groupId: string | undefined
  ) {
    if (groupId) {
      // If a group is specidifed then update that group with the new items
      const groupIndex = groups.findIndex((group) => group.id === groupId);
      let updatedGroups = cloneDeep(groups);
      const group = updatedGroups[groupIndex];
      updatedGroups[groupIndex] = {
        ...group,
        items: newGroups,
      } as GroupContainer;
      onGroupsChange(updatedGroups);
    } else {
      onGroupsChange(newGroups);
    }
  }

  function handleGroupSelect(groupId: string | undefined) {
    let groupIds: string[] = [];
    if (groupId) {
      switch (selectMode) {
        case "single":
          groupIds = [groupId];
          break;
        case "multiple":
          if (selectedGroupIds.includes(groupId)) {
            groupIds = selectedGroupIds.filter((id) => id !== groupId);
          } else {
            groupIds = [...selectedGroupIds, groupId];
          }
          break;
        case "range":
          if (selectedGroupIds.length > 0) {
            const currentIndex = activeGroups.findIndex(
              (g) => g.id === groupId
            );
            const lastIndex = activeGroups.findIndex(
              (g) => g.id === selectedGroupIds[selectedGroupIds.length - 1]
            );
            let idsToAdd: string[] = [];
            let idsToRemove: string[] = [];
            const direction = currentIndex > lastIndex ? 1 : -1;
            for (
              let i = lastIndex + direction;
              direction < 0 ? i >= currentIndex : i <= currentIndex;
              i += direction
            ) {
              const id = activeGroups[i].id;
              if (selectedGroupIds.includes(id)) {
                idsToRemove.push(id);
              } else {
                idsToAdd.push(id);
              }
            }
            groupIds = [...selectedGroupIds, ...idsToAdd].filter(
              (id) => !idsToRemove.includes(id)
            );
          } else {
            groupIds = [groupId];
          }
          break;
        default:
          groupIds = [];
      }
    }
    setSelectedGroupIds(groupIds);
    onGroupsSelect(groupIds);
  }

  /**
   * Shortcuts
   */
  function handleKeyDown(event: React.KeyboardEvent) {
    if (disabled) {
      return;
    }
    if (shortcuts.selectRange(event)) {
      setSelectMode("range");
    }
    if (shortcuts.selectMultiple(event)) {
      setSelectMode("multiple");
    }
  }

  function handleKeyUp(event: React.KeyboardEvent) {
    if (disabled) {
      return;
    }
    if (shortcuts.selectRange(event) && selectMode === "range") {
      setSelectMode("single");
    }
    if (shortcuts.selectMultiple(event) && selectMode === "multiple") {
      setSelectMode("single");
    }
  }

  useKeyboard(handleKeyDown, handleKeyUp);

  // Set select mode to single when cmd+tabing
  function handleBlur() {
    setSelectMode("single");
  }

  useBlur(handleBlur);

  const value = {
    groups,
    activeGroups,
    openGroupId,
    openGroupItems,
    filter,
    filteredGroupItems,
    selectedGroupIds,
    selectMode,
    onSelectModeChange: setSelectMode,
    onGroupOpen: handleGroupOpen,
    onGroupClose: handleGroupClose,
    onGroupsChange: handleGroupsChange,
    onGroupSelect: handleGroupSelect,
    onFilterChange: setFilter,
  };

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}

GroupProvider.defaultProps = {
  groups: [],
  itemNames: {},
  onGroupsChange: () => {},
  onGroupsSelect: () => {},
  disabled: false,
};

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
}

export default GroupContext;

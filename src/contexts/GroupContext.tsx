import React, { useState, useContext, useEffect } from "react";
import cloneDeep from "lodash.clonedeep";
import Fuse from "fuse.js";

import { useKeyboard, useBlur } from "./KeyboardContext";

import { getGroupItems, groupsFromIds } from "../helpers/group";

import shortcuts from "../shortcuts";
import { Group, GroupContainer, GroupItem } from "../types/Group";

export type GroupSelectMode = "single" | "multiple" | "range";
export type GroupSelectModeChangeEventHandler = (
  selectMode: GroupSelectMode
) => void;
export type GroupOpenEventHandler = (groupId: string) => void;
export type GroupCloseEventHandler = () => void;
export type GroupsChangeEventHandler = (newGroups: Group[]) => void;
export type SubgroupsChangeEventHandler = (
  items: GroupItem[],
  groupId: string
) => void;
export type GroupSelectEventHandler = (groupId: string) => void;
export type GroupsSelectEventHandler = (groupIds: string[]) => void;
export type GroupClearSelectionEventHandler = () => void;
export type GroupFilterChangeEventHandler = (filter: string) => void;
export type GroupClearFilterEventHandler = () => void;

type GroupContext = {
  groups: Group[];
  activeGroups: Group[] | GroupItem[];
  openGroupId: string | undefined;
  openGroupItems: GroupItem[];
  filter: string | undefined;
  filteredGroupItems: GroupItem[];
  selectedGroupIds: string[];
  selectMode: GroupSelectMode;
  onSelectModeChange: GroupSelectModeChangeEventHandler;
  onGroupOpen: GroupOpenEventHandler;
  onGroupClose: GroupCloseEventHandler;
  onGroupsChange: GroupsChangeEventHandler;
  onSubgroupChange: SubgroupsChangeEventHandler;
  onGroupSelect: GroupSelectEventHandler;
  onClearSelection: GroupClearSelectionEventHandler;
  onFilterChange: GroupFilterChangeEventHandler;
  onFilterClear: GroupClearFilterEventHandler;
};

const GroupContext = React.createContext<GroupContext | undefined>(undefined);

type GroupProviderProps = {
  groups: Group[];
  itemNames: Record<string, string>;
  onGroupsChange: GroupsChangeEventHandler;
  onGroupsSelect: GroupsSelectEventHandler;
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
  const [selectMode, setSelectMode] = useState<GroupSelectMode>("single");

  /**
   * Group Open
   */
  const [openGroupId, setOpenGroupId] = useState<string>();
  const [openGroupItems, setOpenGroupItems] = useState<GroupItem[]>([]);
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

  function handleGroupsChange(newGroups: Group[]) {
    onGroupsChange(newGroups);
  }

  function handleSubgroupChange(items: GroupItem[], groupId: string) {
    const groupIndex = groups.findIndex((group) => group.id === groupId);
    let updatedGroups = cloneDeep(groups);
    const group = updatedGroups[groupIndex];
    if (group.type === "group") {
      updatedGroups[groupIndex] = {
        ...group,
        items,
      };
      onGroupsChange(updatedGroups);
    } else {
      throw new Error(`Group ${group} not a subgroup`);
    }
  }

  function handleGroupSelect(groupId: string) {
    let groupIds: string[] = [];
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
          const currentIndex = activeGroups.findIndex((g) => g.id === groupId);
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
    setSelectedGroupIds(groupIds);
    onGroupsSelect(groupIds);
  }

  function handleClearSelection() {
    setSelectedGroupIds([]);
    onGroupsSelect([]);
  }

  /**
   * Shortcuts
   */
  function handleKeyDown(event: KeyboardEvent) {
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

  function handleKeyUp(event: KeyboardEvent) {
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

  const value: GroupContext = {
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
    onSubgroupChange: handleSubgroupChange,
    onGroupSelect: handleGroupSelect,
    onClearSelection: handleClearSelection,
    onFilterChange: setFilter,
    onFilterClear: () => setFilter(undefined),
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

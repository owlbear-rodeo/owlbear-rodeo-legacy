import React, { useState, useContext, useEffect } from "react";
import cloneDeep from "lodash.clonedeep";
import Fuse from "fuse.js";

import { useKeyboard, useBlur } from "./KeyboardContext";

import { getGroupItems, groupsFromIds } from "../helpers/group";

import shortcuts from "../shortcuts";

const GroupContext = React.createContext();

export function GroupProvider({
  groups,
  itemNames,
  onGroupsChange,
  onGroupsSelect,
  disabled,
  children,
}) {
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  // Either single, multiple or range
  const [selectMode, setSelectMode] = useState("single");

  /**
   * Group Open
   */
  const [openGroupId, setOpenGroupId] = useState();
  const [openGroupItems, setOpenGroupItems] = useState([]);
  useEffect(() => {
    if (openGroupId) {
      setOpenGroupItems(getGroupItems(groupsFromIds([openGroupId], groups)[0]));
    } else {
      setOpenGroupItems([]);
    }
  }, [openGroupId, groups]);

  function handleGroupOpen(groupId) {
    setSelectedGroupIds([]);
    setOpenGroupId(groupId);
  }

  function handleGroupClose() {
    setSelectedGroupIds([]);
    setOpenGroupId();
  }

  /**
   * Search
   */
  const [filter, setFilter] = useState();
  const [filteredGroupItems, setFilteredGroupItems] = useState([]);
  const [fuse, setFuse] = useState();
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
    if (filter) {
      const query = fuse.search(filter);
      setFilteredGroupItems(query.map((result) => result.item));
      setOpenGroupId();
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
   * @param {string|undefined} groupId The group to apply changes to, leave undefined to replace the full group object
   */
  function handleGroupsChange(newGroups, groupId) {
    if (groupId) {
      // If a group is specidifed then update that group with the new items
      const groupIndex = groups.findIndex((group) => group.id === groupId);
      let updatedGroups = cloneDeep(groups);
      const group = updatedGroups[groupIndex];
      updatedGroups[groupIndex] = { ...group, items: newGroups };
      onGroupsChange(updatedGroups);
    } else {
      onGroupsChange(newGroups);
    }
  }

  function handleGroupSelect(groupId) {
    let groupIds = [];
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
            let idsToAdd = [];
            let idsToRemove = [];
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
  function handleKeyDown(event) {
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

  function handleKeyUp(event) {
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

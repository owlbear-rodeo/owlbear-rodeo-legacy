import React, { useState, useContext, useEffect } from "react";
import cloneDeep from "lodash.clonedeep";

import { useKeyboard, useBlur } from "./KeyboardContext";

import { getGroupItems, groupsFromIds } from "../helpers/group";

import shortcuts from "../shortcuts";

const GroupContext = React.createContext();

export function GroupProvider({
  groups,
  onGroupsChange,
  onGroupsSelect,
  disabled,
  children,
}) {
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [openGroupId, setOpenGroupId] = useState();
  const [openGroupItems, setOpenGroupItems] = useState([]);
  // Either single, multiple or range
  const [selectMode, setSelectMode] = useState("single");

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

  function handleGroupsChange(newGroups) {
    if (openGroupId) {
      // If a group is open then update that group with the new items
      const groupIndex = groups.findIndex((group) => group.id === openGroupId);
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
          /// TODO: Fix when new groups system is added
          return;
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
    openGroupId,
    openGroupItems,
    selectedGroupIds,
    selectMode,
    onGroupOpen: handleGroupOpen,
    onGroupClose: handleGroupClose,
    onGroupsChange: handleGroupsChange,
    onGroupSelect: handleGroupSelect,
  };

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
}

export default GroupContext;

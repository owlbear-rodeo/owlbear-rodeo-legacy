import React, { useState, useContext } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
} from "@dnd-kit/core";

import { useGroup } from "./GroupContext";

import { moveGroupsInto, moveGroups, ungroup } from "../helpers/group";

const TileDragContext = React.createContext();

export const BASE_SORTABLE_ID = "__base__";
export const GROUP_SORTABLE_ID = "__group__";
export const GROUP_ID_PREFIX = "__group__";
export const UNGROUP_ID_PREFIX = "__ungroup__";
export const ADD_TO_MAP_ID_PREFIX = "__add__";

export function TileDragProvider({ onDragAdd, children }) {
  const {
    groups: allGroups,
    openGroupId,
    openGroupItems,
    selectedGroupIds,
    onGroupsChange,
    onGroupSelect,
    onGroupClose,
  } = useGroup();

  const groupOpen = !!openGroupId;

  const groups = groupOpen ? openGroupItems : allGroups;

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const [dragId, setDragId] = useState();
  const [overId, setOverId] = useState();
  const [dragCursor, setDragCursor] = useState("grab");

  function handleDragStart({ active, over }) {
    setDragId(active.id);
    setOverId(over?.id);
    if (!selectedGroupIds.includes(active.id)) {
      onGroupSelect(active.id);
    }
  }

  function handleDragOver({ over }) {
    setOverId(over?.id);
    if (over) {
      if (over.id.startsWith(UNGROUP_ID_PREFIX)) {
        setDragCursor("alias");
      } else if (over.id.startsWith(ADD_TO_MAP_ID_PREFIX)) {
        setDragCursor(onDragAdd ? "copy" : "no-drop");
      } else {
        setDragCursor("grabbing");
      }
    }
  }

  function handleDragEnd({ active, over }) {
    setDragId();
    setOverId();
    setDragCursor("grab");
    if (!active || !over || active.id === over.id) {
      return;
    }

    let selectedIndices = selectedGroupIds.map((groupId) =>
      groups.findIndex((group) => group.id === groupId)
    );
    // Maintain current group sorting
    selectedIndices = selectedIndices.sort((a, b) => a - b);

    if (over.id.startsWith(GROUP_ID_PREFIX)) {
      // Handle tile group
      const overId = over.id.slice(9);
      if (overId === active.id) {
        return;
      }

      const overGroupIndex = groups.findIndex((group) => group.id === overId);
      onGroupsChange(
        moveGroupsInto(groups, overGroupIndex, selectedIndices),
        openGroupId
      );
      onGroupSelect();
    } else if (over.id.startsWith(UNGROUP_ID_PREFIX)) {
      // Handle tile ungroup
      const newGroups = ungroup(allGroups, openGroupId, selectedIndices);
      // Close group if it was removed
      if (!newGroups.find((group) => group.id === openGroupId)) {
        onGroupClose();
      }
      onGroupsChange(newGroups);
      onGroupSelect();
    } else if (over.id.startsWith(ADD_TO_MAP_ID_PREFIX)) {
      onDragAdd && onDragAdd(selectedGroupIds, over.rect);
    } else {
      // Hanlde tile move
      const overGroupIndex = groups.findIndex((group) => group.id === over.id);
      onGroupsChange(
        moveGroups(groups, overGroupIndex, selectedIndices),
        openGroupId
      );
    }
  }

  function customCollisionDetection(rects, rect) {
    // Handle group rects
    if (groupOpen) {
      const ungroupRects = rects.filter(([id]) =>
        id.startsWith(UNGROUP_ID_PREFIX)
      );
      const intersectingGroupRect = rectIntersection(ungroupRects, rect);
      if (intersectingGroupRect) {
        return intersectingGroupRect;
      }
    }

    // Handle add to map rects
    const addRects = rects.filter(([id]) =>
      id.startsWith(ADD_TO_MAP_ID_PREFIX)
    );
    const intersectingAddRect = rectIntersection(addRects, rect);
    if (intersectingAddRect) {
      return intersectingAddRect;
    }

    const otherRects = rects.filter(([id]) => id !== UNGROUP_ID_PREFIX);

    return closestCenter(otherRects, rect);
  }

  const value = { dragId, overId, dragCursor };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      sensors={sensors}
      collisionDetection={customCollisionDetection}
    >
      <TileDragContext.Provider value={value}>
        {children}
      </TileDragContext.Provider>
    </DndContext>
  );
}

export function useTileDrag() {
  const context = useContext(TileDragContext);
  if (context === undefined) {
    throw new Error("useTileDrag must be used within a TileDragProvider");
  }
  return context;
}

export default TileDragContext;

import React, { useState, useContext } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

import { useGroup } from "./GroupContext";

import { moveGroupsInto, moveGroups, ungroup } from "../helpers/group";

const TileDragContext = React.createContext();

export const BASE_SORTABLE_ID = "__base__";
export const GROUP_SORTABLE_ID = "__group__";
export const GROUP_ID_PREFIX = "__group__";
export const UNGROUP_ID = "__ungroup__";
export const ADD_TO_MAP_ID = "__add__";

// Custom rectIntersect that takes a point
function rectIntersection(rects, point) {
  for (let rect of rects) {
    const [id, bounds] = rect;
    if (
      id &&
      bounds &&
      point.x > bounds.offsetLeft &&
      point.x < bounds.offsetLeft + bounds.width &&
      point.y > bounds.offsetTop &&
      point.y < bounds.offsetTop + bounds.height
    ) {
      return id;
    }
  }
  return null;
}

export function TileDragProvider({
  onDragAdd,
  onDragStart,
  onDragEnd,
  onDragCancel,
  children,
}) {
  const {
    groups,
    activeGroups,
    openGroupId,
    selectedGroupIds,
    onGroupsChange,
    onGroupSelect,
    onGroupClose,
    filter,
  } = useGroup();

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, keyboardSensor);

  const [dragId, setDragId] = useState();
  const [overId, setOverId] = useState();
  const [dragCursor, setDragCursor] = useState("pointer");

  function handleDragStart(event) {
    const { active, over } = event;
    setDragId(active.id);
    setOverId(over?.id);
    if (!selectedGroupIds.includes(active.id)) {
      onGroupSelect(active.id);
    }
    setDragCursor("grabbing");

    onDragStart && onDragStart(event);
  }

  function handleDragOver(event) {
    const { over } = event;

    setOverId(over?.id);
    if (over) {
      if (
        over.id.startsWith(UNGROUP_ID) ||
        over.id.startsWith(GROUP_ID_PREFIX)
      ) {
        setDragCursor("alias");
      } else if (over.id.startsWith(ADD_TO_MAP_ID)) {
        setDragCursor(onDragAdd ? "copy" : "no-drop");
      } else {
        setDragCursor("grabbing");
      }
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    setDragId();
    setOverId();
    setDragCursor("pointer");
    if (active && over && active.id !== over.id) {
      let selectedIndices = selectedGroupIds.map((groupId) =>
        activeGroups.findIndex((group) => group.id === groupId)
      );
      // Maintain current group sorting
      selectedIndices = selectedIndices.sort((a, b) => a - b);

      if (over.id.startsWith(GROUP_ID_PREFIX)) {
        onGroupSelect();
        // Handle tile group
        const overId = over.id.slice(9);
        if (overId !== active.id) {
          const overGroupIndex = activeGroups.findIndex(
            (group) => group.id === overId
          );
          onGroupsChange(
            moveGroupsInto(activeGroups, overGroupIndex, selectedIndices),
            openGroupId
          );
        }
      } else if (over.id === UNGROUP_ID) {
        onGroupSelect();
        // Handle tile ungroup
        const newGroups = ungroup(groups, openGroupId, selectedIndices);
        // Close group if it was removed
        if (!newGroups.find((group) => group.id === openGroupId)) {
          onGroupClose();
        }
        onGroupsChange(newGroups);
      } else if (over.id === ADD_TO_MAP_ID) {
        onDragAdd && onDragAdd(selectedGroupIds, over.rect);
      } else if (!filter) {
        // Hanlde tile move only if we have no filter
        const overGroupIndex = activeGroups.findIndex(
          (group) => group.id === over.id
        );
        onGroupsChange(
          moveGroups(activeGroups, overGroupIndex, selectedIndices),
          openGroupId
        );
      }
    }

    onDragEnd && onDragEnd(event);
  }

  function handleDragCancel(event) {
    setDragId();
    setOverId();
    setDragCursor("pointer");

    onDragCancel && onDragCancel(event);
  }

  function customCollisionDetection(rects, rect) {
    const rectCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    // Find whether out rect center is outside our add to map rect
    const addRect = rects.find(([id]) => id === ADD_TO_MAP_ID);
    if (addRect) {
      const intersectingAddRect = rectIntersection([addRect], rectCenter);
      if (!intersectingAddRect) {
        return ADD_TO_MAP_ID;
      }
    }

    // Find whether out rect center is outside our ungroup rect
    if (openGroupId) {
      const ungroupRect = rects.find(([id]) => id === UNGROUP_ID);
      if (ungroupRect) {
        const intersectingGroupRect = rectIntersection(
          [ungroupRect],
          rectCenter
        );
        if (!intersectingGroupRect) {
          return UNGROUP_ID;
        }
      }
    }

    const otherRects = rects.filter(
      ([id]) => id !== ADD_TO_MAP_ID && id !== UNGROUP_ID
    );

    return closestCenter(otherRects, rect);
  }

  const value = { dragId, overId, dragCursor };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
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

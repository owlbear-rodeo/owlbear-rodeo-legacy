import React, { useState, useContext, useEffect } from "react";
import {
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

import DragContext from "./DragContext";

import { useGroup } from "./GroupContext";

import { moveGroupsInto, moveGroups, ungroup } from "../helpers/group";

import usePreventSelect from "../hooks/usePreventSelect";

const TileDragIdContext = React.createContext();
const TileOverGroupIdContext = React.createContext();
const TileDragCursorContext = React.createContext();

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
    filter,
  } = useGroup();

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 3 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [dragCursor, setDragCursor] = useState("pointer");

  const [preventSelect, resumeSelect] = usePreventSelect();

  const [overGroupId, setOverGroupId] = useState(null);
  useEffect(() => {
    setOverGroupId(
      (overId && overId.startsWith(GROUP_ID_PREFIX) && overId.slice(9)) || null
    );
  }, [overId]);

  function handleDragStart(event) {
    const { active, over } = event;
    setDragId(active.id);
    setOverId(over?.id || null);
    if (!selectedGroupIds.includes(active.id)) {
      onGroupSelect(active.id);
    }
    setDragCursor("grabbing");

    onDragStart && onDragStart(event);

    preventSelect();
  }

  function handleDragOver(event) {
    const { over } = event;

    setOverId(over?.id || null);
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
    const { active, over, overlayNodeClientRect } = event;

    setDragId(null);
    setOverId(null);
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
        onGroupsChange(newGroups);
      } else if (over.id === ADD_TO_MAP_ID) {
        onDragAdd &&
          overlayNodeClientRect &&
          onDragAdd(selectedGroupIds, overlayNodeClientRect);
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

    resumeSelect();

    onDragEnd && onDragEnd(event);
  }

  function handleDragCancel(event) {
    setDragId(null);
    setOverId(null);
    setDragCursor("pointer");

    resumeSelect();

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

  return (
    <DragContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      sensors={sensors}
      collisionDetection={customCollisionDetection}
    >
      <TileDragIdContext.Provider value={dragId}>
        <TileOverGroupIdContext.Provider value={overGroupId}>
          <TileDragCursorContext.Provider value={dragCursor}>
            {children}
          </TileDragCursorContext.Provider>
        </TileOverGroupIdContext.Provider>
      </TileDragIdContext.Provider>
    </DragContext>
  );
}

export function useTileDragId() {
  const context = useContext(TileDragIdContext);
  if (context === undefined) {
    throw new Error("useTileDrag must be used within a TileDragProvider");
  }
  return context;
}

export function useTileOverGroupId() {
  const context = useContext(TileOverGroupIdContext);
  if (context === undefined) {
    throw new Error("useTileDrag must be used within a TileDragProvider");
  }
  return context;
}

export function useTileDragCursor() {
  const context = useContext(TileDragCursorContext);
  if (context === undefined) {
    throw new Error("useTileDrag must be used within a TileDragProvider");
  }
  return context;
}

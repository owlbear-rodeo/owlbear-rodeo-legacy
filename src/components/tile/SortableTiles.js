import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { animated, useSpring, config } from "react-spring";

import { moveGroups } from "../../helpers/group";
import { keyBy } from "../../helpers/shared";

import SortableTile from "./SortableTile";

function SortableTiles({
  groups,
  selectedGroupIds,
  onGroupChange,
  renderTile,
  onTileSelect,
  disableGrouping,
  openGroupId,
  columns,
}) {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const [dragId, setDragId] = useState();
  const [overId, setOverId] = useState();

  function handleDragStart({ active, over }) {
    setDragId(active.id);
    setOverId(over?.id);
    if (!selectedGroupIds.includes(active.id)) {
      onTileSelect(active.id);
    }
  }

  function handleDragOver({ over }) {
    setOverId(over?.id);
  }

  function handleDragEnd({ active, over }) {
    setDragId();
    setOverId();
    if (!active || !over) {
      return;
    }

    if (over.id.startsWith("__group__")) {
      const overId = over.id.slice(9);
      if (overId === active.id) {
        return;
      }

      let newGroups = groups;
      const overGroupIndex = groups.findIndex((group) => group.id === overId);
      const selectedGroupIndices = selectedGroupIds.map((groupId) =>
        groups.findIndex((group) => group.id === groupId)
      );
      onGroupChange(
        moveGroups(newGroups, overGroupIndex, selectedGroupIndices)
      );
      onTileSelect();
    } else if (active.id !== over.id) {
      let newGroups = groups;
      for (let groupId of selectedGroupIds) {
        const oldIndex = newGroups.findIndex((group) => group.id === groupId);
        const newIndex = newGroups.findIndex((group) => group.id === over.id);
        newGroups = arrayMove(newGroups, oldIndex, newIndex);
      }
      onGroupChange(newGroups);
    }
  }

  const dragBounce = useSpring({
    transform: !!dragId ? "scale(0.9)" : "scale(1)",
    config: config.wobbly,
  });

  const overGroupId =
    overId && overId.startsWith("__group__") && overId.slice(9);

  function renderSortableGroup(group, selectedGroups) {
    if (overGroupId === group.id && dragId && group.id !== dragId) {
      // If dragging over a group render a preview of that group
      const previewGroup = moveGroups(
        [group, ...selectedGroups],
        0,
        selectedGroups.map((_, i) => i + 1)
      )[0];
      return renderTile(previewGroup);
    }
    return renderTile(group);
  }

  function renderDragOverlays() {
    let selectedIndices = selectedGroupIds.map((groupId) =>
      groups.findIndex((group) => group.id === groupId)
    );
    let activeIndex = groups.findIndex((group) => group.id === dragId);

    const coords = selectedIndices.map((index) => ({
      x: index % columns,
      y: Math.floor(index / columns),
    }));
    const activeCoord = {
      x: activeIndex % columns,
      y: Math.floor(activeIndex / columns),
    };

    const relativeCoords = coords.map(({ x, y }) => ({
      x: x - activeCoord.x,
      y: y - activeCoord.y,
    }));

    return selectedGroupIds.map((groupId, index) => (
      <DragOverlay dropAnimation={null} key={groupId}>
        <div
          style={{
            transform: `translate(${relativeCoords[index].x * 100}%, ${
              relativeCoords[index].y * 100
            }%)`,
          }}
        >
          <animated.div style={dragBounce}>
            {renderTile(groups.find((group) => group.id === groupId))}
          </animated.div>
        </div>
      </DragOverlay>
    ));
  }

  function renderTiles() {
    const groupsByIds = keyBy(groups, "id");
    const selectedGroupIdsSet = new Set(selectedGroupIds);
    let selectedGroups = [];
    let hasSelectedContainerGroup = false;
    for (let groupId of selectedGroupIds) {
      const group = groupsByIds[groupId];
      if (group) {
        selectedGroups.push(group);
        if (group.type === "group") {
          hasSelectedContainerGroup = true;
        }
      }
    }
    return groups.map((group) => {
      const isDragging = dragId && selectedGroupIdsSet.has(group.id);
      const disableTileGrouping =
        disableGrouping || isDragging || hasSelectedContainerGroup;
      return (
        <SortableTile
          id={group.id}
          key={group.id}
          disableGrouping={disableTileGrouping}
          hidden={group.id === openGroupId}
          isDragging={isDragging}
        >
          {renderSortableGroup(group, selectedGroups)}
        </SortableTile>
      );
    });
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <SortableContext items={groups}>
        {renderTiles()}
        {createPortal(dragId && renderDragOverlays(), document.body)}
      </SortableContext>
    </DndContext>
  );
}

export default SortableTiles;

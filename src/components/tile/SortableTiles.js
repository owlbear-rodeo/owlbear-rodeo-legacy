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
import { Badge } from "theme-ui";

import { moveGroups } from "../../helpers/group";
import { keyBy } from "../../helpers/shared";
import Vector2 from "../../helpers/Vector2";

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
    position: "relative",
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
    const activeIndex = groups.findIndex((group) => group.id === dragId);
    // Sort so the draging tile is the first element
    selectedIndices = selectedIndices.sort((a, b) =>
      a === activeIndex ? -1 : b === activeIndex ? 1 : 0
    );

    selectedIndices = selectedIndices.slice(0, 5);

    let coords = selectedIndices.map(
      (_, index) => new Vector2(5 * index, 5 * index)
    );

    // Reverse so the first element is rendered on top
    selectedIndices = selectedIndices.reverse();
    coords = coords.reverse();

    const selectedGroups = selectedIndices.map((index) => groups[index]);

    return selectedGroups.map((group, index) => (
      <DragOverlay dropAnimation={null} key={group.id}>
        <div
          style={{
            transform: `translate(${coords[index].x}%, ${coords[index].y}%)`,
          }}
        >
          <animated.div style={dragBounce}>
            {renderTile(group)}
            {index === selectedIndices.length - 1 &&
              selectedGroupIds.length > 1 && (
                <Badge
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    transform: "translate(25%, -25%)",
                  }}
                >
                  {selectedGroupIds.length}
                </Badge>
              )}
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

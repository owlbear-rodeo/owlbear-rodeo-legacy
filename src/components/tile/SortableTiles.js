import React from "react";
import { createPortal } from "react-dom";
import { DragOverlay } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { animated, useSpring, config } from "react-spring";
import { Badge } from "theme-ui";

import { moveGroupsInto } from "../../helpers/group";
import { keyBy } from "../../helpers/shared";
import Vector2 from "../../helpers/Vector2";

import SortableTile from "./SortableTile";

import {
  useTileDrag,
  BASE_SORTABLE_ID,
  GROUP_SORTABLE_ID,
  GROUP_ID_PREFIX,
} from "../../contexts/TileDragContext";
import { useGroup } from "../../contexts/GroupContext";

function SortableTiles({ renderTile, subgroup }) {
  const { dragId, overId, dragCursor } = useTileDrag();
  const {
    groups: allGroups,
    selectedGroupIds: allSelectedIds,
    openGroupId,
    openGroupItems,
  } = useGroup();

  const sortableId = subgroup ? GROUP_SORTABLE_ID : BASE_SORTABLE_ID;

  const groups = subgroup ? openGroupItems : allGroups;
  // Only populate selected groups if needed
  let selectedGroupIds = [];
  if ((subgroup && openGroupId) || (!subgroup && !openGroupId)) {
    selectedGroupIds = allSelectedIds;
  }
  const disableSorting = openGroupId && !subgroup;
  const disableGrouping = subgroup || disableSorting;

  const dragBounce = useSpring({
    transform: !!dragId ? "scale(0.9)" : "scale(1)",
    config: config.wobbly,
    position: "relative",
  });

  const overGroupId =
    overId && overId.startsWith(GROUP_ID_PREFIX) && overId.slice(9);

  function renderSortableGroup(group, selectedGroups) {
    if (overGroupId === group.id && dragId && group.id !== dragId) {
      // If dragging over a group render a preview of that group
      const previewGroup = moveGroupsInto(
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
            cursor: dragCursor,
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
          disableSorting={disableSorting}
          hidden={group.id === openGroupId}
          isDragging={isDragging}
          cursor={dragCursor}
        >
          {renderSortableGroup(group, selectedGroups)}
        </SortableTile>
      );
    });
  }

  return (
    <SortableContext items={groups} id={sortableId}>
      {renderTiles()}
      {createPortal(dragId && renderDragOverlays(), document.body)}
    </SortableContext>
  );
}

export default SortableTiles;

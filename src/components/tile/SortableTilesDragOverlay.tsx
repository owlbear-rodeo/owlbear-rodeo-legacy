import React from "react";
import { createPortal } from "react-dom";
import { DragOverlay } from "@dnd-kit/core";
import { animated, useSpring, config } from "react-spring";
import { Badge } from "theme-ui";

import Vector2 from "../../helpers/Vector2";

import { useTileDragId } from "../../contexts/TileDragContext";
import { useGroup } from "../../contexts/GroupContext";
import { Group } from "../../types/Group";

type SortableTilesDragOverlayProps = {
  renderTile: (group: Group) => React.ReactNode;
  subgroup: boolean;
};

function SortableTilesDragOverlay({
  renderTile,
  subgroup,
}: SortableTilesDragOverlayProps) {
  const dragId = useTileDragId();
  const {
    groups,
    selectedGroupIds: allSelectedIds,
    filter,
    openGroupId,
    openGroupItems,
    filteredGroupItems,
  } = useGroup();

  const activeGroups = subgroup
    ? openGroupItems
    : filter
    ? filteredGroupItems
    : groups;

  // Only populate selected groups if needed
  let selectedGroupIds: string[] = [];
  if ((subgroup && openGroupId) || (!subgroup && !openGroupId)) {
    selectedGroupIds = allSelectedIds;
  }
  const dragBounce = useSpring({
    transform: !!dragId ? "scale(0.9)" : "scale(1)",
    config: config.wobbly,
  });

  function renderDragOverlays() {
    let selectedIndices = selectedGroupIds.map((groupId) =>
      activeGroups.findIndex((group) => group.id === groupId)
    );
    const activeIndex = activeGroups.findIndex((group) => group.id === dragId);
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

    const selectedGroups = selectedIndices.map((index) => activeGroups[index]);

    return selectedGroups.map((group, index) => (
      <DragOverlay dropAnimation={null} key={group.id}>
        <div
          style={{
            transform: `translate(${coords[index].x}%, ${coords[index].y}%)`,
          }}
        >
          <animated.div style={{ ...dragBounce, position: "relative" }}>
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

  return createPortal(dragId && renderDragOverlays(), document.body);
}

export default SortableTilesDragOverlay;

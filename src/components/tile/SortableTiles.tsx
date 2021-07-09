import React from "react";
import { SortableContext } from "@dnd-kit/sortable";

import { moveGroupsInto } from "../../helpers/group";
import { keyBy } from "../../helpers/shared";

import SortableTile from "./SortableTile";
import LazyTile from "./LazyTile";

import {
  useTileDragId,
  useTileDragCursor,
  useTileOverGroupId,
  BASE_SORTABLE_ID,
  GROUP_SORTABLE_ID,
} from "../../contexts/TileDragContext";
import { useGroup } from "../../contexts/GroupContext";
import { Group } from "../../types/Group";

type SortableTilesProps = {
  renderTile: (group: Group) => React.ReactNode;
  subgroup: boolean;
};

function SortableTiles({ renderTile, subgroup }: SortableTilesProps) {
  const dragId = useTileDragId();
  const dragCursor = useTileDragCursor();
  const overGroupId = useTileOverGroupId();
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

  const sortableId = subgroup ? GROUP_SORTABLE_ID : BASE_SORTABLE_ID;

  // Only populate selected groups if needed
  let selectedGroupIds: string[] = [];
  if ((subgroup && openGroupId) || (!subgroup && !openGroupId)) {
    selectedGroupIds = allSelectedIds;
  }
  const disableSorting = !!((openGroupId && !subgroup) || filter);
  const disableGrouping = !!(subgroup || disableSorting || filter);

  function renderSortableGroup(group: Group, selectedGroups: Group[]) {
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

  function renderTiles() {
    const groupsByIds = keyBy(activeGroups, "id");
    const selectedGroupIdsSet = new Set(selectedGroupIds);
    let selectedGroups: Group[] = [];
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
    return activeGroups.map((group: Group) => {
      const isDragging = dragId !== null && selectedGroupIdsSet.has(group.id);
      const disableTileGrouping =
        disableGrouping || isDragging || hasSelectedContainerGroup;
      return (
        <LazyTile key={group.id}>
          <SortableTile
            id={group.id}
            disableGrouping={disableTileGrouping}
            disableSorting={disableSorting}
            hidden={group.id === openGroupId}
            isDragging={isDragging}
            cursor={dragCursor || ""}
          >
            {renderSortableGroup(group, selectedGroups)}
          </SortableTile>
        </LazyTile>
      );
    });
  }

  return (
    <SortableContext items={activeGroups} id={sortableId}>
      {renderTiles()}
    </SortableContext>
  );
}

export default SortableTiles;

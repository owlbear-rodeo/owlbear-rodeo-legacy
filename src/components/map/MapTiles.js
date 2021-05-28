import React from "react";

import MapTile from "./MapTile";
import MapTileGroup from "./MapTileGroup";

import SortableTiles from "../tile/SortableTiles";

import { getGroupItems } from "../../helpers/group";

import { useGroup } from "../../contexts/GroupContext";

function MapTiles({ maps, onMapEdit, onMapSelect, subgroup }) {
  const {
    selectedGroupIds,
    selectMode,
    onGroupOpen,
    onGroupSelect,
  } = useGroup();

  function renderTile(group) {
    if (group.type === "item") {
      const map = maps.find((map) => map.id === group.id);
      const isSelected = selectedGroupIds.includes(group.id);
      const canEdit =
        isSelected && selectMode === "single" && selectedGroupIds.length === 1;
      return (
        <MapTile
          key={map.id}
          map={map}
          isSelected={isSelected}
          onSelect={onGroupSelect}
          onEdit={onMapEdit}
          onDoubleClick={() => canEdit && onMapSelect(group.id)}
          canEdit={canEdit}
          badges={[`${map.grid.size.x}x${map.grid.size.y}`]}
        />
      );
    } else {
      const isSelected = selectedGroupIds.includes(group.id);
      const items = getGroupItems(group);
      const canOpen =
        isSelected && selectMode === "single" && selectedGroupIds.length === 1;
      return (
        <MapTileGroup
          key={group.id}
          group={group}
          maps={items.map((item) => maps.find((map) => map.id === item.id))}
          isSelected={isSelected}
          onSelect={onGroupSelect}
          onDoubleClick={() => canOpen && onGroupOpen(group.id)}
        />
      );
    }
  }

  return <SortableTiles renderTile={renderTile} subgroup={subgroup} />;
}

export default MapTiles;

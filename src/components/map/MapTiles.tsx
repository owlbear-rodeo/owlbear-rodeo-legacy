import React from "react";

import MapTile from "./MapTile";
import MapTileGroup from "./MapTileGroup";

import SortableTiles from "../tile/SortableTiles";
import SortableTilesDragOverlay from "../tile/SortableTilesDragOverlay";

import { getGroupItems } from "../../helpers/group";

import { useGroup } from "../../contexts/GroupContext";

import { Map } from "../../types/Map";
import { Group } from "../../types/Group";

type MapTileProps = {
  mapsById: Record<string, Map>;
  onMapEdit: (mapId: string) => void;
  onMapSelect: (groupId: string) => void;
  subgroup: boolean;
};

function MapTiles({
  mapsById,
  onMapEdit,
  onMapSelect,
  subgroup,
}: MapTileProps) {
  const { selectedGroupIds, selectMode, onGroupOpen, onGroupSelect } =
    useGroup();

  function renderTile(group: Group) {
    if (group.type === "item") {
      const map = mapsById[group.id];
      if (map) {
        const isSelected = selectedGroupIds.includes(group.id);
        const canEdit =
          isSelected &&
          selectMode === "single" &&
          selectedGroupIds.length === 1;
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
      }
    } else {
      const isSelected = selectedGroupIds.includes(group.id);
      const items = getGroupItems(group);
      const canOpen =
        isSelected && selectMode === "single" && selectedGroupIds.length === 1;
      return (
        <MapTileGroup
          key={group.id}
          group={group}
          maps={items.map((item) => mapsById[item.id])}
          isSelected={isSelected}
          onSelect={onGroupSelect}
          onDoubleClick={() => canOpen && onGroupOpen(group.id)}
        />
      );
    }
  }

  return (
    <>
      <SortableTiles renderTile={renderTile} subgroup={subgroup} />
      <SortableTilesDragOverlay renderTile={renderTile} subgroup={subgroup} />
    </>
  );
}

MapTiles.defaultProps = {
  subgroup: false,
};

export default MapTiles;

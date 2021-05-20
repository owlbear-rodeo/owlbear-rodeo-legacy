import React from "react";

import Tile from "../Tile";
import MapTileImage from "./MapTileImage";

function MapTile({
  map,
  isSelected,
  onSelect,
  onEdit,
  onDone,
  canEdit,
  badges,
}) {
  return (
    <Tile
      title={map.name}
      isSelected={isSelected}
      onSelect={() => onSelect({ id: map.id })}
      onEdit={() => onEdit(map.id)}
      onDoubleClick={() => canEdit && onDone()}
      canEdit={canEdit}
      badges={badges}
      editTitle="Edit Map"
    >
      <MapTileImage map={map} />
    </Tile>
  );
}

export default MapTile;

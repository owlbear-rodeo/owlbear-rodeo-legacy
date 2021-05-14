import React from "react";

import Tile from "../Tile";
import MapTileImage from "./MapTileImage";

function MapTile({
  map,
  isSelected,
  onMapSelect,
  onMapEdit,
  onDone,
  canEdit,
  badges,
}) {
  return (
    <Tile
      title={map.name}
      isSelected={isSelected}
      onSelect={() => onMapSelect(map)}
      onEdit={() => onMapEdit(map.id)}
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

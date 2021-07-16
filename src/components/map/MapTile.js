import React from "react";

import Tile from "../tile/Tile";
import MapImage from "./MapTileImage";

function MapTile({
  map,
  isSelected,
  onSelect,
  onEdit,
  onDoubleClick,
  canEdit,
  badges,
}) {
  return (
    <Tile
      title={map.name}
      isSelected={isSelected}
      onSelect={() => onSelect(map.id)}
      onEdit={() => onEdit(map.id)}
      onDoubleClick={() => canEdit && onDoubleClick()}
      canEdit={canEdit}
      badges={badges}
      editTitle="Edit Map"
    >
      <MapImage map={map} />
    </Tile>
  );
}

export default MapTile;

import React from "react";

import Tile from "../Tile";

import { useDataURL } from "../../contexts/AssetsContext";
import { mapSources as defaultMapSources, unknownSource } from "../../maps";

function MapTile({
  map,
  isSelected,
  onMapSelect,
  onMapEdit,
  onDone,
  size,
  canEdit,
  badges,
}) {
  const mapURL = useDataURL(
    map,
    defaultMapSources,
    unknownSource,
    map.type === "file"
  );

  return (
    <Tile
      src={mapURL}
      title={map.name}
      isSelected={isSelected}
      onSelect={() => onMapSelect(map)}
      onEdit={() => onMapEdit(map.id)}
      onDoubleClick={() => canEdit && onDone()}
      size={size}
      canEdit={canEdit}
      badges={badges}
      editTitle="Edit Map"
    />
  );
}

export default MapTile;

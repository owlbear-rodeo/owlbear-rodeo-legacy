import React from "react";

import Tile from "../Tile";

import useDataSource from "../../helpers/useDataSource";
import { mapSources as defaultMapSources, unknownSource } from "../../maps";

function MapTile({
  map,
  isSelected,
  onMapSelect,
  onMapEdit,
  onDone,
  large,
  canEdit,
  badges,
}) {
  const isDefault = map.type === "default";
  const mapSource = useDataSource(
    isDefault
      ? map
      : map.resolutions && map.resolutions.low
      ? map.resolutions.low
      : map,
    defaultMapSources,
    unknownSource
  );

  return (
    <Tile
      src={mapSource}
      title={map.name}
      isSelected={isSelected}
      onSelect={() => onMapSelect(map)}
      onEdit={() => onMapEdit(map.id)}
      onDoubleClick={onDone}
      large={large}
      canEdit={canEdit}
      badges={badges}
    />
  );
}

export default MapTile;

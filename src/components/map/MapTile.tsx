import React from "react";
import { Map } from "../../types/Map";

import Tile from "../tile/Tile";
import MapImage from "./MapTileImage";

type MapTileProps = {
  map: Map;
  isSelected: boolean;
  onSelect: (mapId: string) => void;
  onEdit: (mapId: string) => void;
  onDoubleClick: () => void;
  canEdit: boolean;
  badges: React.ReactChild[];
};

function MapTile({
  map,
  isSelected,
  onSelect,
  onEdit,
  onDoubleClick,
  canEdit,
  badges,
}: MapTileProps) {
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

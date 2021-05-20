import React from "react";

import Tile from "../Tile";
import MapTileImage from "./MapTileImage";

function MapTileGroup({ group, maps, isSelected, onSelect, onOpen, canOpen }) {
  return (
    <Tile
      title={group.name}
      isSelected={isSelected}
      onSelect={() => onSelect(group)}
      onDoubleClick={() => canOpen && onOpen()}
      columns="1fr 1fr"
    >
      {maps.slice(0, 4).map((map) => (
        <MapTileImage
          sx={{ padding: 1, borderRadius: "8px" }}
          map={map}
          key={map.id}
        />
      ))}
    </Tile>
  );
}

export default MapTileGroup;

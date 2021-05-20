import React from "react";
import { Grid } from "theme-ui";

import Tile from "../Tile";
import MapTileImage from "./MapTileImage";

function MapTileGroup({ group, maps, isSelected, onSelect, onOpen, canOpen }) {
  return (
    <Tile
      title={group.name}
      isSelected={isSelected}
      onSelect={() => onSelect(group)}
      onDoubleClick={() => canOpen && onOpen()}
    >
      <Grid columns="1fr 1fr" p={2} sx={{ gridGap: 2 }}>
        {maps.slice(0, 4).map((map) => (
          <MapTileImage sx={{ borderRadius: "8px" }} map={map} key={map.id} />
        ))}
      </Grid>
    </Tile>
  );
}

export default MapTileGroup;

import React from "react";
import { Grid } from "theme-ui";

import Tile from "../tile/Tile";
import MapImage from "./MapTileImage";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

function MapTileGroup({ group, maps, isSelected, onSelect, onDoubleClick }) {
  const layout = useResponsiveLayout();

  return (
    <Tile
      title={group.name}
      isSelected={isSelected}
      onSelect={() => onSelect(group.id)}
      onDoubleClick={onDoubleClick}
    >
      <Grid
        columns={`repeat(${layout.groupGridColumns}, 1fr)`}
        p={2}
        sx={{
          gridGap: 2,
          gridTemplateRows: `repeat(${layout.groupGridColumns}, 1fr)`,
        }}
      >
        {maps
          .slice(0, layout.groupGridColumns * layout.groupGridColumns)
          .map((map) => (
            <MapImage
              sx={{ borderRadius: "8px" }}
              map={map}
              key={`${map.id}-group-tile`}
            />
          ))}
      </Grid>
    </Tile>
  );
}

export default MapTileGroup;

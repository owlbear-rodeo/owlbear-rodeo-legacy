import React from "react";
import { Grid } from "theme-ui";

import Tile from "../tile/Tile";
import TokenTileImage from "./TokenTileImage";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

function TokenTileGroup({
  group,
  tokens,
  isSelected,
  onSelect,
  onDoubleClick,
}) {
  const layout = useResponsiveLayout();

  return (
    <Tile
      title={group.name}
      isSelected={isSelected}
      onSelect={() => onSelect(group.id)}
      onDoubleClick={onDoubleClick}
      columns="1fr 1fr"
    >
      <Grid columns={layout.groupGridTemplate} p={2} sx={{ gridGap: 2 }}>
        {tokens.slice(0, 16).map((token) => (
          <TokenTileImage
            sx={{ borderRadius: "8px" }}
            token={token}
            key={`${token.id}-group-tile`}
          />
        ))}
      </Grid>
    </Tile>
  );
}

export default TokenTileGroup;

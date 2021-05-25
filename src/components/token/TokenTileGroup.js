import React from "react";
import { Grid } from "theme-ui";

import Tile from "../tile/Tile";
import TokenImage from "./TokenImage";

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
    >
      <Grid
        columns={`repeat(${layout.groupGridColumns}, 1fr)`}
        p={2}
        sx={{ gridGap: 2 }}
      >
        {tokens.slice(0, 9).map((token) => (
          <TokenImage
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

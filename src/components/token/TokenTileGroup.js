import React from "react";
import { Grid } from "theme-ui";

import Tile from "../Tile";
import TokenTileImage from "./TokenTileImage";

function TokenTileGroup({
  group,
  tokens,
  isSelected,
  onSelect,
  onOpen,
  canOpen,
}) {
  return (
    <Tile
      title={group.name}
      isSelected={isSelected}
      onSelect={() => onSelect(group)}
      onDoubleClick={() => canOpen && onOpen()}
      columns="1fr 1fr"
    >
      <Grid columns="1fr 1fr" p={2} sx={{ gridGap: 2 }}>
        {tokens.slice(0, 4).map((token) => (
          <TokenTileImage
            sx={{ padding: 1, borderRadius: "8px" }}
            token={token}
            key={token.id}
          />
        ))}
      </Grid>
    </Tile>
  );
}

export default TokenTileGroup;

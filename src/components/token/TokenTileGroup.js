import React from "react";

import Tile from "../Tile";
import TokenTileImage from "./TokenTileImage";

function TokenTileGroup({
  group,
  tokens,
  isSelected,
  onGroupSelect,
  onOpen,
  canOpen,
}) {
  return (
    <Tile
      title={group.name}
      isSelected={isSelected}
      // onSelect={() => onGroupSelect(group)}
      // onDoubleClick={() => canOpen && onOpen()}
      columns="1fr 1fr"
    >
      {tokens.slice(0, 4).map((token) => (
        <TokenTileImage
          sx={{ padding: 1, borderRadius: "8px" }}
          token={token}
          key={token.id}
        />
      ))}
    </Tile>
  );
}

export default TokenTileGroup;

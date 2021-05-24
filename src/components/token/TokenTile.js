import React from "react";

import Tile from "../tile/Tile";
import TokenTileImage from "./TokenTileImage";

function TokenTile({
  token,
  isSelected,
  onSelect,
  onTokenEdit,
  canEdit,
  badges,
}) {
  return (
    <Tile
      title={token.name}
      isSelected={isSelected}
      onSelect={() => onSelect(token.id)}
      onEdit={() => onTokenEdit(token.id)}
      canEdit={canEdit}
      badges={badges}
      editTitle="Edit Token"
    >
      <TokenTileImage token={token} />
    </Tile>
  );
}

export default TokenTile;

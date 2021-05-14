import React from "react";

import Tile from "../Tile";
import TokenTileImage from "./TokenTileImage";

function TokenTile({
  token,
  isSelected,
  onTokenSelect,
  onTokenEdit,
  canEdit,
  badges,
}) {
  return (
    <Tile
      title={token.name}
      isSelected={isSelected}
      onSelect={() => onTokenSelect(token)}
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

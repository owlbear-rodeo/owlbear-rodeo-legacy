import React from "react";
import { Token } from "../../types/Token";

import Tile from "../tile/Tile";
import TokenImage from "./TokenImage";

type TokenTileProps = {
  token: Token;
  isSelected: boolean;
  onSelect: (tokenId: string) => void;
  onTokenEdit: (tokenId: string) => void;
  canEdit: boolean;
  badges: React.ReactChild[];
};

function TokenTile({
  token,
  isSelected,
  onSelect,
  onTokenEdit,
  canEdit,
  badges,
}: TokenTileProps) {
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
      <TokenImage token={token} />
    </Tile>
  );
}

export default TokenTile;

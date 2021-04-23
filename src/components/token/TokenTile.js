import React from "react";

import Tile from "../Tile";

import { useDataURL } from "../../contexts/AssetsContext";

import {
  tokenSources as defaultTokenSources,
  unknownSource,
} from "../../tokens";

function TokenTile({
  token,
  isSelected,
  onTokenSelect,
  onTokenEdit,
  size,
  canEdit,
  badges,
}) {
  const tokenURL = useDataURL(
    token,
    defaultTokenSources,
    unknownSource,
    token.type === "file"
  );

  return (
    <Tile
      src={tokenURL}
      title={token.name}
      isSelected={isSelected}
      onSelect={() => onTokenSelect(token)}
      onEdit={() => onTokenEdit(token.id)}
      size={size}
      canEdit={canEdit}
      badges={badges}
      editTitle="Edit Token"
    />
  );
}

export default TokenTile;

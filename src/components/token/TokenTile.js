import React from "react";

import Tile from "../Tile";

import { useImageSource } from "../../contexts/ImageSourceContext";

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
  const tokenSource = useImageSource(
    token,
    defaultTokenSources,
    unknownSource,
    token.type === "file"
  );

  return (
    <Tile
      src={tokenSource}
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

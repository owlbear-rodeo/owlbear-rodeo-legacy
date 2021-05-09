import React from "react";

import Tile from "../Tile";

import { useDataURL } from "../../contexts/AssetsContext";

import { tokenSources as defaultTokenSources } from "../../tokens";

function TokenTile({
  token,
  isSelected,
  onTokenSelect,
  onTokenEdit,
  canEdit,
  badges,
}) {
  const tokenURL = useDataURL(
    token,
    defaultTokenSources,
    undefined,
    token.type === "file"
  );

  return (
    <Tile
      src={tokenURL}
      title={token.name}
      isSelected={isSelected}
      onSelect={() => onTokenSelect(token)}
      onEdit={() => onTokenEdit(token.id)}
      canEdit={canEdit}
      badges={badges}
      editTitle="Edit Token"
    />
  );
}

export default TokenTile;

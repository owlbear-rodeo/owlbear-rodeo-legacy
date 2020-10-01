import React from "react";

import Tile from "../Tile";

import useDataSource from "../../helpers/useDataSource";
import {
  tokenSources as defaultTokenSources,
  unknownSource,
} from "../../tokens";

function TokenTile({
  token,
  isSelected,
  onTokenSelect,
  onTokenEdit,
  large,
  canEdit,
  badges,
}) {
  const tokenSource = useDataSource(token, defaultTokenSources, unknownSource);

  return (
    <Tile
      src={tokenSource}
      title={token.name}
      isSelected={isSelected}
      onSelect={() => onTokenSelect(token)}
      onEdit={() => onTokenEdit(token.id)}
      large={large}
      canEdit={canEdit}
      badges={badges}
      editTitle="Edit Token"
    />
  );
}

export default TokenTile;

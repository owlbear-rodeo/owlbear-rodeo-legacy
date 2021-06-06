import React from "react";

import TokenTile from "./TokenTile";
import TokenTileGroup from "./TokenTileGroup";
import TokenHiddenBadge from "./TokenHiddenBadge";

import SortableTiles from "../tile/SortableTiles";

import { getGroupItems } from "../../helpers/group";

import { useGroup } from "../../contexts/GroupContext";

function TokenTiles({ tokens, onTokenEdit, subgroup }) {
  const {
    selectedGroupIds,
    selectMode,
    onGroupOpen,
    onGroupSelect,
  } = useGroup();

  function renderTile(group) {
    if (group.type === "item") {
      const token = tokens.find((token) => token.id === group.id);
      const isSelected = selectedGroupIds.includes(group.id);
      const canEdit =
        isSelected && selectMode === "single" && selectedGroupIds.length === 1;

      return (
        <TokenTile
          key={token.id}
          token={token}
          isSelected={isSelected}
          onSelect={onGroupSelect}
          onTokenEdit={onTokenEdit}
          canEdit={canEdit}
          badges={[
            `${token.defaultSize}x`,
            <TokenHiddenBadge hidden={token.hideInSidebar} />,
          ]}
        />
      );
    } else {
      const isSelected = selectedGroupIds.includes(group.id);
      const items = getGroupItems(group);
      const canOpen =
        isSelected && selectMode === "single" && selectedGroupIds.length === 1;
      return (
        <TokenTileGroup
          key={group.id}
          group={group}
          tokens={items.map((item) =>
            tokens.find((token) => token.id === item.id)
          )}
          isSelected={isSelected}
          onSelect={onGroupSelect}
          onDoubleClick={() => canOpen && onGroupOpen(group.id)}
        />
      );
    }
  }

  return <SortableTiles renderTile={renderTile} subgroup={subgroup} />;
}

export default TokenTiles;

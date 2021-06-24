import React from "react";
import { Group } from "react-konva";

import MapToken from "./MapToken";

function MapTokens({
  map,
  mapState,
  tokenDraggingOptions,
  setTokenDraggingOptions,
  onMapTokenStateChange,
  handleTokenMenuOpen,
  selectedToolId,
  disabledTokens,
}) {
  function getMapTokenCategoryWeight(category) {
    switch (category) {
      case "character":
        return 0;
      case "vehicle":
        return 1;
      case "prop":
        return 2;
      default:
        return 0;
    }
  }

  // Sort so vehicles render below other tokens
  function sortMapTokenStates(a, b, tokenDraggingOptions) {
    // If categories are different sort in order "prop", "vehicle", "character"
    if (b.category !== a.category) {
      const aWeight = getMapTokenCategoryWeight(a.category);
      const bWeight = getMapTokenCategoryWeight(b.category);
      return bWeight - aWeight;
    } else if (
      tokenDraggingOptions &&
      tokenDraggingOptions.dragging &&
      tokenDraggingOptions.tokenState.id === a.id
    ) {
      // If dragging token a move above
      return 1;
    } else if (
      tokenDraggingOptions &&
      tokenDraggingOptions.dragging &&
      tokenDraggingOptions.tokenState.id === b.id
    ) {
      // If dragging token b move above
      return -1;
    } else {
      // Else sort so last modified is on top
      return a.lastModified - b.lastModified;
    }
  }

  return (
    <Group>
      {Object.values(mapState.tokens)
        .sort((a, b) => sortMapTokenStates(a, b, tokenDraggingOptions))
        .map((tokenState) => (
          <MapToken
            key={tokenState.id}
            tokenState={tokenState}
            onTokenStateChange={onMapTokenStateChange}
            onTokenMenuOpen={handleTokenMenuOpen}
            onTokenDragStart={(e) =>
              setTokenDraggingOptions({
                dragging: true,
                tokenState,
                tokenGroup: e.target,
              })
            }
            onTokenDragEnd={() =>
              setTokenDraggingOptions({
                ...tokenDraggingOptions,
                dragging: false,
              })
            }
            draggable={
              selectedToolId === "move" &&
              !(tokenState.id in disabledTokens) &&
              !tokenState.locked
            }
            fadeOnHover={selectedToolId === "drawing"}
            map={map}
          />
        ))}
    </Group>
  );
}

export default MapTokens;

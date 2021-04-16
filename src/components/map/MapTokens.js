import React, { useEffect } from "react";
import { Group } from "react-konva";

import MapToken from "./MapToken";

import { useTokenData } from "../../contexts/TokenDataContext";

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
  const { tokensById, loadTokens } = useTokenData();

  // Ensure tokens files have been loaded into the token data
  useEffect(() => {
    async function loadFileTokens() {
      const tokenIds = new Set(
        Object.values(mapState.tokens).map((state) => state.tokenId)
      );
      const tokensToLoad = [];
      for (let tokenId of tokenIds) {
        const token = tokensById[tokenId];
        if (token && token.type === "file" && !token.file) {
          tokensToLoad.push(tokenId);
        }
      }
      if (tokensToLoad.length > 0) {
        await loadTokens(tokensToLoad);
      }
    }

    if (mapState) {
      loadFileTokens();
    }
  }, [mapState, tokensById, loadTokens]);

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
    const tokenA = tokensById[a.tokenId];
    const tokenB = tokensById[b.tokenId];
    if (tokenA && tokenB) {
      // If categories are different sort in order "prop", "vehicle", "character"
      if (tokenB.category !== tokenA.category) {
        const aWeight = getMapTokenCategoryWeight(tokenA.category);
        const bWeight = getMapTokenCategoryWeight(tokenB.category);
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
    } else if (tokenA) {
      return 1;
    } else if (tokenB) {
      return -1;
    } else {
      return 0;
    }
  }

  return (
    <Group>
      {Object.values(mapState.tokens)
        .sort((a, b) => sortMapTokenStates(a, b, tokenDraggingOptions))
        .map((tokenState) => (
          <MapToken
            key={tokenState.id}
            token={tokensById[tokenState.tokenId]}
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

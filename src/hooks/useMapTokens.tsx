import { Group } from "react-konva";

import { Map, MapToolId } from "../types/Map";
import { MapState } from "../types/MapState";
import {
  TokenCategory,
  TokenDraggingOptions,
  TokenMenuOptions,
} from "../types/Token";
import { TokenState } from "../types/TokenState";
import {
  TokenStateRemoveHandler,
  TokenStateChangeEventHandler,
} from "../types/Events";
import { useState } from "react";
import Konva from "konva";
import Token from "../components/konva/Token";
import { KonvaEventObject } from "konva/lib/Node";
import TokenMenu from "../components/token/TokenMenu";
import TokenDragOverlay from "../components/token/TokenDragOverlay";

function useMapTokens(
  map: Map | null,
  mapState: MapState | null,
  onTokenStateChange: TokenStateChangeEventHandler,
  onTokenStateRemove: TokenStateRemoveHandler,
  selectedToolId: MapToolId,
  disabledTokens: Record<string, boolean>
) {
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState<boolean>(false);
  const [tokenMenuOptions, setTokenMenuOptions] = useState<TokenMenuOptions>();
  const [tokenDraggingOptions, setTokenDraggingOptions] =
    useState<TokenDraggingOptions>();

  function handleTokenMenuOpen(tokenStateId: string, tokenImage: Konva.Node) {
    setTokenMenuOptions({ tokenStateId, tokenImage });
    setIsTokenMenuOpen(true);
  }

  function handleTokenDragStart(
    event: KonvaEventObject<DragEvent>,
    tokenStateId: string
  ) {
    setTokenDraggingOptions({
      dragging: true,
      tokenStateId,
      tokenNode: event.target,
    });
  }

  function handleTokenDragEnd() {
    tokenDraggingOptions &&
      setTokenDraggingOptions({
        ...tokenDraggingOptions,
        dragging: false,
      });
  }

  function handleTokenStateRemove(tokenStateIds: string[]) {
    onTokenStateRemove(tokenStateIds);
    setTokenDraggingOptions(undefined);
  }

  const tokens = map && mapState && (
    <Group>
      {Object.values(mapState.tokens)
        .sort((a, b) => sortMapTokenStates(a, b, tokenDraggingOptions))
        .map((tokenState) => (
          <Token
            key={tokenState.id}
            tokenState={tokenState}
            onTokenStateChange={onTokenStateChange}
            onTokenMenuOpen={handleTokenMenuOpen}
            onTokenDragStart={handleTokenDragStart}
            onTokenDragEnd={handleTokenDragEnd}
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

  const tokenMenu = (
    <TokenMenu
      isOpen={isTokenMenuOpen}
      onRequestClose={() => setIsTokenMenuOpen(false)}
      onTokenStateChange={onTokenStateChange}
      tokenState={
        tokenMenuOptions && mapState?.tokens[tokenMenuOptions.tokenStateId]
      }
      tokenImage={tokenMenuOptions?.tokenImage}
      map={map}
    />
  );

  const tokenDraggingState =
    tokenDraggingOptions && mapState?.tokens[tokenDraggingOptions.tokenStateId];

  const tokenDragOverlay = tokenDraggingOptions && tokenDraggingState && (
    <TokenDragOverlay
      onTokenStateRemove={handleTokenStateRemove}
      tokenState={tokenDraggingState}
      tokenNode={tokenDraggingOptions.tokenNode}
      dragging={!!(tokenDraggingOptions && tokenDraggingOptions.dragging)}
    />
  );

  return { tokens, tokenMenu, tokenDragOverlay };
}

export default useMapTokens;

function getMapTokenCategoryWeight(category: TokenCategory) {
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
function sortMapTokenStates(
  a: TokenState,
  b: TokenState,
  tokenDraggingOptions?: TokenDraggingOptions
) {
  // If categories are different sort in order "prop", "vehicle", "character"
  if (b.category !== a.category) {
    const aWeight = getMapTokenCategoryWeight(a.category);
    const bWeight = getMapTokenCategoryWeight(b.category);
    return bWeight - aWeight;
  } else if (
    tokenDraggingOptions &&
    tokenDraggingOptions.dragging &&
    tokenDraggingOptions.tokenStateId === a.id
  ) {
    // If dragging token a move above
    return 1;
  } else if (
    tokenDraggingOptions &&
    tokenDraggingOptions.dragging &&
    tokenDraggingOptions.tokenStateId === b.id
  ) {
    // If dragging token b move above
    return -1;
  } else {
    // Else sort so last modified is on top
    return a.lastModified - b.lastModified;
  }
}

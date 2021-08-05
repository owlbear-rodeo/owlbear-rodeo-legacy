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
import { useUserId } from "../contexts/UserIdContext";

function useMapTokens(
  map: Map | null,
  mapState: MapState | null,
  onTokenStateChange: TokenStateChangeEventHandler,
  onTokenStateRemove: TokenStateRemoveHandler,
  selectedToolId: MapToolId
) {
  const userId = useUserId();
  const disabledTokens: Record<string, boolean> = {};
  if (mapState && map) {
    if (!mapState.editFlags.includes("tokens") && map.owner !== userId) {
      for (let token of Object.values(mapState.tokens)) {
        if (token.owner !== userId) {
          disabledTokens[token.id] = true;
        }
      }
    }
  }

  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState<boolean>(false);
  const [tokenMenuOptions, setTokenMenuOptions] = useState<TokenMenuOptions>();
  const [tokenDraggingOptions, setTokenDraggingOptions] =
    useState<TokenDraggingOptions>();

  function handleTokenMenuOpen(tokenStateId: string, tokenImage: Konva.Node) {
    setTokenMenuOptions({ tokenStateId, tokenImage });
    setIsTokenMenuOpen(true);
  }

  function handleTokenMenuClose() {
    setIsTokenMenuOpen(false);
  }

  function handleTokenDragStart(
    _: KonvaEventObject<DragEvent>,
    tokenStateId: string
  ) {
    setTokenDraggingOptions({
      dragging: true,
      tokenStateId,
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

  function tokenFromTokenState(tokenState: TokenState) {
    return (
      map && (
        <Token
          key={tokenState.id}
          tokenState={tokenState}
          onTokenStateChange={onTokenStateChange}
          onTokenMenuOpen={handleTokenMenuOpen}
          onTokenMenuClose={handleTokenMenuClose}
          onTokenDragStart={handleTokenDragStart}
          onTokenDragEnd={handleTokenDragEnd}
          draggable={
            selectedToolId === "move" &&
            !(tokenState.id in disabledTokens) &&
            !tokenState.locked
          }
          selectable={
            selectedToolId === "move" &&
            ((!(tokenState.id in disabledTokens) && !tokenState.locked) ||
              map.owner === userId)
          }
          fadeOnHover={
            tokenState.category !== "prop" && selectedToolId === "drawing"
          }
          map={map}
          selected={
            !!tokenMenuOptions &&
            isTokenMenuOpen &&
            tokenMenuOptions.tokenStateId === tokenState.id
          }
        />
      )
    );
  }

  const tokens = map && mapState && (
    <Group id="tokens">
      {Object.values(mapState.tokens)
        .filter((tokenState) => tokenState.category !== "prop")
        .sort((a, b) => sortMapTokenStates(a, b, tokenDraggingOptions))
        .map(tokenFromTokenState)}
    </Group>
  );

  const propTokens = map && mapState && (
    <Group id="tokens">
      {Object.values(mapState.tokens)
        .filter((tokenState) => tokenState.category === "prop")
        .sort((a, b) => sortMapTokenStates(a, b, tokenDraggingOptions))
        .map(tokenFromTokenState)}
    </Group>
  );

  const tokenMenu = (
    <TokenMenu
      isOpen={isTokenMenuOpen}
      onRequestClose={handleTokenMenuClose}
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
      dragging={!!(tokenDraggingOptions && tokenDraggingOptions.dragging)}
    />
  );

  return { tokens, propTokens, tokenMenu, tokenDragOverlay };
}

export default useMapTokens;

function getMapTokenCategoryWeight(category: TokenCategory) {
  switch (category) {
    case "attachment":
      return 0;
    case "character":
      return 1;
    case "vehicle":
      return 2;
    case "prop":
      return 3;
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
  // If categories are different sort in order "prop", "vehicle", "character", "attachment"
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

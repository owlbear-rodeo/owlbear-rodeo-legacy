import { useState, useRef, useCallback, useMemo } from "react";
import { Image as KonvaImage, Group } from "react-konva";
import { useSpring, animated } from "@react-spring/konva";
import Konva from "konva";
import useImage from "use-image";

import usePrevious from "../../hooks/usePrevious";
import useGridSnapping from "../../hooks/useGridSnapping";

import { useUserId } from "../../contexts/UserIdContext";
import {
  useSetPreventMapInteraction,
  useMapWidth,
  useMapHeight,
} from "../../contexts/MapInteractionContext";
import { useGridCellPixelSize } from "../../contexts/GridContext";
import { useDataURL } from "../../contexts/AssetsContext";

import TokenStatus from "./TokenStatus";
import TokenLabel from "./TokenLabel";
import TokenOutline from "./TokenOutline";

import { Intersection, getScaledOutline } from "../../helpers/token";
import Vector2 from "../../helpers/Vector2";

import { tokenSources } from "../../tokens";
import { TokenState } from "../../types/TokenState";
import { Map } from "../../types/Map";
import {
  TokenDragEventHandler,
  TokenMenuCloseChangeEventHandler,
  TokenMenuOpenChangeEventHandler,
  TokenStateChangeEventHandler,
  TokenTransformEventHandler,
} from "../../types/Events";
import Transformer from "./Transformer";
import TokenAttachment from "./TokenAttachment";
import { MapState } from "../../types/MapState";

type MapTokenProps = {
  tokenState: TokenState;
  onTokenStateChange: TokenStateChangeEventHandler;
  onTokenMenuOpen: TokenMenuOpenChangeEventHandler;
  onTokenMenuClose: TokenMenuCloseChangeEventHandler;
  onTokenDragStart: TokenDragEventHandler;
  onTokenDragEnd: TokenDragEventHandler;
  onTokenTransformStart: TokenTransformEventHandler;
  onTokenTransformEnd: TokenTransformEventHandler;
  transforming: boolean;
  draggable: boolean;
  selectable: boolean;
  fadeOnHover: boolean;
  map: Map;
  mapState: MapState;
  selected: boolean;
};

function Token({
  tokenState,
  onTokenStateChange,
  onTokenMenuOpen,
  onTokenMenuClose,
  onTokenDragStart,
  onTokenDragEnd,
  onTokenTransformStart,
  onTokenTransformEnd,
  transforming,
  draggable,
  selectable,
  fadeOnHover,
  map,
  mapState,
  selected,
}: MapTokenProps) {
  const userId = useUserId();

  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const setPreventMapInteraction = useSetPreventMapInteraction();

  const gridCellPixelSize = useGridCellPixelSize();

  const tokenURL = useDataURL(tokenState, tokenSources);
  const [tokenImage] = useImage(tokenURL || "");

  const tokenAspectRatio = tokenState.width / tokenState.height;

  const snapPositionToGrid = useGridSnapping();

  const [dragging, setDragging] = useState(false);
  const previousDragPositionRef = useRef({ x: 0, y: 0 });

  // Tokens that are attached to this token and should move when it moves
  const attachedTokensRef = useRef<Konva.Node[]>([]);
  // If this an attachment is it over a character
  const [attachmentOverCharacter, setAttachmentOverCharacter] = useState(false);
  // The characters that we're present when an attachment is dragged, used to highlight the attachment
  const attachmentCharactersRef = useRef<Konva.Node[]>([]);
  const attachmentThreshold = useMemo(
    () => Vector2.componentMin(gridCellPixelSize) / 4,
    [gridCellPixelSize]
  );

  function handleDragStart(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenGroup = event.target as Konva.Shape;
    previousDragPositionRef.current = tokenGroup.position();

    attachedTokensRef.current = getAttachedTokens();

    if (tokenState.category === "attachment") {
      // If we're dragging an attachment add all characters to the attachment characters
      // So we can check for highlights
      const characters = tokenGroup.getLayer()?.find(".character") || [];
      attachmentCharactersRef.current = characters;
    }

    setDragging(true);
    onTokenDragStart(
      event,
      tokenState.id,
      attachedTokensRef.current.map((token) => token.id())
    );
  }

  function handleDragMove(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenGroup = event.target;
    // Snap to corners of grid
    if (map.snapToGrid) {
      tokenGroup.position(snapPositionToGrid(tokenGroup.position()));
    }
    if (attachedTokensRef.current.length > 0) {
      const deltaPosition = Vector2.subtract(
        tokenGroup.position(),
        previousDragPositionRef.current
      );
      for (let other of attachedTokensRef.current) {
        other.position(Vector2.add(other.position(), deltaPosition));
      }
      previousDragPositionRef.current = tokenGroup.position();
    }
    // Check whether an attachment is over a character
    if (tokenState.category === "attachment") {
      const characters = attachmentCharactersRef.current;
      let overCharacter = false;
      for (let character of characters) {
        const distance = Vector2.distance(
          tokenGroup.position(),
          character.position()
        );
        if (distance < attachmentThreshold) {
          overCharacter = true;
          break;
        }
      }
      if (attachmentOverCharacter !== overCharacter) {
        setAttachmentOverCharacter(overCharacter);
      }
    }
  }

  function handleDragEnd(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenGroup = event.target;

    const attachedTokenChanges: Record<string, Partial<TokenState>> = {};
    if (attachedTokensRef.current.length > 0) {
      for (let other of attachedTokensRef.current) {
        attachedTokenChanges[other.id()] = {
          x: other.x() / mapWidth,
          y: other.y() / mapHeight,
          lastModifiedBy: userId,
          lastModified: Date.now(),
        };
      }
    }

    setPreventMapInteraction(false);
    onTokenStateChange({
      ...attachedTokenChanges,
      [tokenState.id]: {
        x: tokenGroup.x() / mapWidth,
        y: tokenGroup.y() / mapHeight,
        lastModifiedBy: userId,
        lastModified: Date.now(),
      },
    });

    setDragging(false);

    onTokenDragEnd(
      event,
      tokenState.id,
      attachedTokensRef.current.map((token) => token.id())
    );

    attachmentCharactersRef.current = [];
    attachedTokensRef.current = [];
    setAttachmentOverCharacter(false);
  }

  function handleClick() {
    if (selectable && draggable && transformRootRef.current) {
      onTokenMenuOpen(tokenState.id, transformRootRef.current, true);
    }
  }

  const [tokenOpacity, setTokenOpacity] = useState(1);
  // Store token pointer down time to check for a click when token is locked
  const tokenPointerDownTimeRef = useRef<number>(0);
  function handlePointerDown(event: Konva.KonvaEventObject<PointerEvent>) {
    if (draggable) {
      setPreventMapInteraction(true);
    }
    if (tokenState.locked && selectable) {
      tokenPointerDownTimeRef.current = event.evt.timeStamp;
    }
  }

  function handlePointerUp(event: Konva.KonvaEventObject<PointerEvent>) {
    if (draggable) {
      setPreventMapInteraction(false);
    }
    // Check token click when locked and selectable
    // We can't use onClick because that doesn't check pointer distance
    if (tokenState.locked && selectable && transformRootRef.current) {
      // If down and up time is small trigger a click
      const delta = event.evt.timeStamp - tokenPointerDownTimeRef.current;
      if (delta < 300) {
        onTokenMenuOpen(tokenState.id, transformRootRef.current, true);
      }
    }
  }

  function handlePointerEnter() {
    if (fadeOnHover) {
      setTokenOpacity(0.5);
    }
  }

  function handlePointerLeave() {
    if (tokenOpacity !== 1.0) {
      setTokenOpacity(1.0);
    }
  }

  const transformRootRef = useRef<Konva.Group>(null);

  const minCellSize = Math.min(
    gridCellPixelSize.width,
    gridCellPixelSize.height
  );
  const tokenWidth = minCellSize * tokenState.size;
  const tokenHeight = (minCellSize / tokenAspectRatio) * tokenState.size;

  // Animate to new token positions if edited by others
  const tokenX = tokenState.x * mapWidth;
  const tokenY = tokenState.y * mapHeight;
  const previousWidth = usePrevious(mapWidth);
  const previousHeight = usePrevious(mapHeight);
  const resized = mapWidth !== previousWidth || mapHeight !== previousHeight;
  const skipAnimation = tokenState.lastModifiedBy === userId || resized;
  const props = useSpring({
    x: tokenX,
    y: tokenY,
    immediate: skipAnimation,
  });

  const getAttachedTokens = useCallback(() => {
    const transformRoot = transformRootRef.current;
    const tokenGroup = transformRoot?.parent;
    const layer = transformRoot?.getLayer();
    let attachedTokens: Konva.Node[] = [];
    if (tokenGroup && layer) {
      if (tokenState.category === "vehicle") {
        const tokenIntersection = new Intersection(
          getScaledOutline(tokenState, tokenWidth, tokenHeight),
          { x: tokenX - tokenWidth / 2, y: tokenY - tokenHeight / 2 },
          { x: tokenX, y: tokenY },
          tokenState.rotation
        );

        // Find all other characters on the map and check whether they're
        // intersecting the vehicle
        const characters = layer.find(".character");
        const attachments = layer.find(".attachment");
        const tokens = [...characters, ...attachments];
        for (let other of tokens) {
          const id = other.id();
          if (id in mapState.tokens) {
            const position = {
              x: mapState.tokens[id].x * mapWidth,
              y: mapState.tokens[id].y * mapHeight,
            };
            if (tokenIntersection.intersects(position)) {
              attachedTokens.push(other);
            }
          }
        }
      }

      if (tokenState.category === "character") {
        // Find all attachments and check whether they are close to the center of this token
        const attachments = layer.find(".attachment");
        for (let attachment of attachments) {
          const id = attachment.id();
          if (id in mapState.tokens) {
            const position = {
              x: mapState.tokens[id].x * mapWidth,
              y: mapState.tokens[id].y * mapHeight,
            };
            const distance = Vector2.distance(tokenGroup.position(), position);
            if (distance < attachmentThreshold) {
              attachedTokens.push(attachment);
            }
          }
        }
      }
    }

    return attachedTokens;
  }, [
    attachmentThreshold,
    tokenHeight,
    tokenWidth,
    tokenState,
    tokenX,
    tokenY,
    mapState,
    mapWidth,
    mapHeight,
  ]);

  // Override transform active to always show this transformer when using it
  const [overrideTransformActive, setOverrideTransformActive] = useState(false);

  function handleTransformStart(event: Konva.KonvaEventObject<Event>) {
    setOverrideTransformActive(true);
    onTokenTransformStart(event);
    onTokenMenuClose();
  }

  function handleTransformEnd(event: Konva.KonvaEventObject<Event>) {
    const transformer = event.currentTarget as Konva.Transformer;
    const nodes = transformer.nodes();
    const tokenChanges: Record<string, Partial<TokenState>> = {};
    for (let node of nodes) {
      const id = node.id();
      if (id in mapState.tokens) {
        const sizeChange = node.scaleX();
        const rotation = node.rotation();
        const xChange = node.x() / mapWidth;
        const yChange = node.y() / mapHeight;
        tokenChanges[id] = {
          size: mapState.tokens[id].size * sizeChange,
          rotation: rotation,
          x: mapState.tokens[id].x + xChange,
          y: mapState.tokens[id].y + yChange,
        };
      }
      node.scaleX(1);
      node.scaleY(1);
      node.x(0);
      node.y(0);
    }

    onTokenStateChange(tokenChanges);
    if (transformRootRef.current) {
      onTokenMenuOpen(tokenState.id, transformRootRef.current, false);
    }
    setOverrideTransformActive(false);
    onTokenTransformEnd(event);
  }

  const transformerActive = useMemo(
    () => (!tokenState.locked && selected) || overrideTransformActive,
    [tokenState, selected, overrideTransformActive]
  );

  const transformerNodes = useMemo(
    () => () => {
      if (transformRootRef.current) {
        // Find attached transform roots
        const attached = getAttachedTokens().map((node) =>
          (node as Konva.Group).findOne(".transform-root")
        );
        return [transformRootRef.current, ...attached];
      } else {
        return [];
      }
    },
    [getAttachedTokens]
  );

  // When a token is hidden if you aren't the map owner hide it completely
  if (map && !tokenState.visible && map.owner !== userId) {
    return null;
  }

  // Token name is used by on click to find whether a token is a vehicle or prop
  let tokenName = "";
  if (tokenState) {
    tokenName = tokenState.category;
  }
  if (tokenState && tokenState.locked) {
    tokenName = tokenName + "-locked";
  }

  return (
    <>
      <animated.Group
        {...props}
        width={tokenWidth}
        height={tokenHeight}
        draggable={draggable}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        opacity={tokenState.visible ? tokenOpacity : 0.5}
        name={tokenName}
        id={tokenState.id}
      >
        <Group
          ref={transformRootRef}
          id={tokenState.id}
          name="transform-root"
          rotation={tokenState.rotation}
          offsetX={tokenWidth / 2}
          offsetY={tokenHeight / 2}
        >
          <Group width={tokenWidth} height={tokenHeight} x={0} y={0}>
            <TokenOutline
              outline={getScaledOutline(tokenState, tokenWidth, tokenHeight)}
              hidden={!!tokenImage}
              // Disable hit detection for attachments
              hitFunc={
                tokenState.category === "attachment" ? () => {} : undefined
              }
            />
          </Group>
          <KonvaImage
            width={tokenWidth}
            height={tokenHeight}
            x={0}
            y={0}
            image={tokenImage}
            hitFunc={() => {}}
          />
        </Group>
        {!transforming ? (
          <Group offsetX={tokenWidth / 2} offsetY={tokenHeight / 2}>
            {tokenState.statuses?.length > 0 ? (
              <TokenStatus
                tokenState={tokenState}
                width={tokenWidth}
                height={tokenHeight}
              />
            ) : null}
            {tokenState.category === "attachment" ? (
              <Group offsetX={-tokenWidth / 2} offsetY={-tokenHeight / 2}>
                <Group rotation={tokenState.rotation}>
                  <TokenAttachment
                    tokenHeight={tokenHeight}
                    dragging={dragging}
                    highlight={attachmentOverCharacter}
                    radius={attachmentThreshold * 2}
                  />
                </Group>
              </Group>
            ) : null}
            {tokenState.label ? (
              <TokenLabel
                tokenState={tokenState}
                width={tokenWidth}
                height={tokenHeight}
              />
            ) : null}
          </Group>
        ) : null}
      </animated.Group>
      <Transformer
        active={transformerActive}
        nodes={transformerNodes}
        onTransformEnd={handleTransformEnd}
        onTransformStart={handleTransformStart}
        gridScale={map.grid.measurement.scale}
      />
    </>
  );
}

export default Token;

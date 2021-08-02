import { useState, useRef } from "react";
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
} from "../../types/Events";
import Transformer from "./Transformer";

type MapTokenProps = {
  tokenState: TokenState;
  onTokenStateChange: TokenStateChangeEventHandler;
  onTokenMenuOpen: TokenMenuOpenChangeEventHandler;
  onTokenMenuClose: TokenMenuCloseChangeEventHandler;
  onTokenDragStart: TokenDragEventHandler;
  onTokenDragEnd: TokenDragEventHandler;
  draggable: boolean;
  fadeOnHover: boolean;
  map: Map;
  selected: boolean;
};

function Token({
  tokenState,
  onTokenStateChange,
  onTokenMenuOpen,
  onTokenMenuClose,
  onTokenDragStart,
  onTokenDragEnd,
  draggable,
  fadeOnHover,
  map,
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

  const intersectingTokensRef = useRef<Konva.Node[]>([]);
  const previousDragPositionRef = useRef({ x: 0, y: 0 });

  function handleDragStart(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenGroup = event.target;

    if (tokenState.category === "vehicle") {
      previousDragPositionRef.current = tokenGroup.position();
      const tokenIntersection = new Intersection(
        getScaledOutline(tokenState, tokenWidth, tokenHeight),
        { x: tokenX - tokenWidth / 2, y: tokenY - tokenHeight / 2 },
        { x: tokenX, y: tokenY },
        tokenState.rotation
      );

      // Find all other tokens on the map
      const layer = tokenGroup.getLayer() as Konva.Layer;
      const tokens = layer.find(".character");
      for (let other of tokens) {
        if (other === tokenGroup) {
          continue;
        }
        if (tokenIntersection.intersects(other.position())) {
          intersectingTokensRef.current.push(other);
        }
      }
    }

    onTokenDragStart(event, tokenState.id);
  }

  function handleDragMove(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenGroup = event.target;
    // Snap to corners of grid
    if (map.snapToGrid) {
      tokenGroup.position(snapPositionToGrid(tokenGroup.position()));
    }
    if (tokenState.category === "vehicle") {
      const deltaPosition = Vector2.subtract(
        tokenGroup.position(),
        previousDragPositionRef.current
      );
      for (let other of intersectingTokensRef.current) {
        other.position(Vector2.add(other.position(), deltaPosition));
      }
      previousDragPositionRef.current = tokenGroup.position();
    }
  }

  function handleDragEnd(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenGroup = event.target;

    const mountChanges: Record<string, Partial<TokenState>> = {};
    if (tokenState.category === "vehicle") {
      for (let other of intersectingTokensRef.current) {
        mountChanges[other.id()] = {
          x: other.x() / mapWidth,
          y: other.y() / mapHeight,
          lastModifiedBy: userId,
          lastModified: Date.now(),
        };
      }
      intersectingTokensRef.current = [];
    }

    setPreventMapInteraction(false);
    onTokenStateChange({
      ...mountChanges,
      [tokenState.id]: {
        x: tokenGroup.x() / mapWidth,
        y: tokenGroup.y() / mapHeight,
        lastModifiedBy: userId,
        lastModified: Date.now(),
      },
    });
    onTokenDragEnd(event, tokenState.id);
  }

  function handleClick(event: Konva.KonvaEventObject<MouseEvent>) {
    if (draggable) {
      const tokenImage = event.target;
      onTokenMenuOpen(tokenState.id, tokenImage);
    }
  }

  const [tokenOpacity, setTokenOpacity] = useState(1);
  // Store token pointer down time to check for a click when token is locked
  const tokenPointerDownTimeRef = useRef<number>(0);
  function handlePointerDown(event: Konva.KonvaEventObject<PointerEvent>) {
    if (draggable) {
      setPreventMapInteraction(true);
    }
    if (tokenState.locked && map.owner === userId) {
      tokenPointerDownTimeRef.current = event.evt.timeStamp;
    }
  }

  function handlePointerUp(event: Konva.KonvaEventObject<PointerEvent>) {
    if (draggable) {
      setPreventMapInteraction(false);
    }
    // Check token click when locked and we are the map owner
    // We can't use onClick because that doesn't check pointer distance
    if (tokenState.locked && map.owner === userId) {
      // If down and up time is small trigger a click
      const delta = event.evt.timeStamp - tokenPointerDownTimeRef.current;
      if (delta < 300) {
        const tokenImage = event.target;
        onTokenMenuOpen(tokenState.id, tokenImage);
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

  const tokenRef = useRef<Konva.Group>(null);

  const [isTransforming, setIsTransforming] = useState(false);
  function handleTransformStart() {
    setIsTransforming(true);
    onTokenMenuClose();
  }

  function handleTransformEnd(event: Konva.KonvaEventObject<Event>) {
    if (tokenRef.current) {
      const sizeChange = event.target.scaleX();
      const rotation = event.target.rotation();
      onTokenStateChange({
        [tokenState.id]: {
          size: tokenState.size * sizeChange,
          rotation: rotation,
        },
      });
      tokenRef.current.scaleX(1);
      tokenRef.current.scaleY(1);
      onTokenMenuOpen(tokenState.id, event.target);
    }
    setIsTransforming(false);
  }

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
          ref={tokenRef}
          rotation={tokenState.rotation}
          offsetX={tokenWidth / 2}
          offsetY={tokenHeight / 2}
        >
          <Group width={tokenWidth} height={tokenHeight} x={0} y={0}>
            <TokenOutline
              outline={getScaledOutline(tokenState, tokenWidth, tokenHeight)}
              hidden={!!tokenImage}
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
        {!isTransforming ? (
          <Group offsetX={tokenWidth / 2} offsetY={tokenHeight / 2}>
            {tokenState.statuses?.length > 0 ? (
              <TokenStatus
                tokenState={tokenState}
                width={tokenWidth}
                height={tokenHeight}
              />
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
        active={selected || isTransforming}
        nodeRef={tokenRef}
        onTransformEnd={handleTransformEnd}
        onTransformStart={handleTransformStart}
      />
    </>
  );
}

export default Token;

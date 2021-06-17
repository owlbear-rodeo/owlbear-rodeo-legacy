import React, { useState, useRef } from "react";
import { Image as KonvaImage, Group } from "react-konva";
import { useSpring, animated } from "react-spring/konva";
import useImage from "use-image";

import usePrevious from "../../hooks/usePrevious";
import useGridSnapping from "../../hooks/useGridSnapping";

import { useAuth } from "../../contexts/AuthContext";
import {
  useSetPreventMapInteraction,
  useMapWidth,
  useMapHeight,
} from "../../contexts/MapInteractionContext";
import { useGridCellPixelSize } from "../../contexts/GridContext";
import { useDataURL } from "../../contexts/AssetsContext";

import TokenStatus from "../token/TokenStatus";
import TokenLabel from "../token/TokenLabel";
import TokenOutline from "../token/TokenOutline";

import { Intersection, getScaledOutline } from "../../helpers/token";

import { tokenSources } from "../../tokens";

function MapToken({
  tokenState,
  onTokenStateChange,
  onTokenMenuOpen,
  onTokenDragStart,
  onTokenDragEnd,
  draggable,
  fadeOnHover,
  map,
}) {
  const { userId } = useAuth();

  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const setPreventMapInteraction = useSetPreventMapInteraction();

  const gridCellPixelSize = useGridCellPixelSize();

  const tokenURL = useDataURL(tokenState, tokenSources);
  const [tokenImage] = useImage(tokenURL);

  const tokenAspectRatio = tokenState.width / tokenState.height;

  const snapPositionToGrid = useGridSnapping();

  function handleDragStart(event) {
    const tokenGroup = event.target;

    if (tokenState.category === "vehicle") {
      const tokenIntersection = new Intersection(
        getScaledOutline(tokenState, tokenWidth, tokenHeight),
        { x: tokenX - tokenWidth / 2, y: tokenY - tokenHeight / 2 },
        { x: tokenX, y: tokenY },
        tokenState.rotation
      );

      // Find all other tokens on the map
      const layer = tokenGroup.getLayer();
      const tokens = layer.find(".character");
      for (let other of tokens) {
        if (other === tokenGroup) {
          continue;
        }
        if (tokenIntersection.intersects(other.position())) {
          // Save and restore token position after moving layer
          const position = other.absolutePosition();
          other.moveTo(tokenGroup);
          other.absolutePosition(position);
        }
      }
    }

    onTokenDragStart(event);
  }

  function handleDragMove(event) {
    const tokenGroup = event.target;
    // Snap to corners of grid
    if (map.snapToGrid) {
      tokenGroup.position(snapPositionToGrid(tokenGroup.position()));
    }
  }

  function handleDragEnd(event) {
    const tokenGroup = event.target;

    const mountChanges = {};
    if (tokenState.category === "vehicle") {
      const parent = tokenGroup.getParent();
      const mountedTokens = tokenGroup.find(".character");
      for (let mountedToken of mountedTokens) {
        // Save and restore token position after moving layer
        const position = mountedToken.absolutePosition();
        mountedToken.moveTo(parent);
        mountedToken.absolutePosition(position);
        mountChanges[mountedToken.id()] = {
          x: mountedToken.x() / mapWidth,
          y: mountedToken.y() / mapHeight,
          lastModifiedBy: userId,
          lastModified: Date.now(),
        };
      }
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
    onTokenDragEnd(event);
  }

  function handleClick(event) {
    if (draggable) {
      const tokenImage = event.target;
      onTokenMenuOpen(tokenState.id, tokenImage);
    }
  }

  const [tokenOpacity, setTokenOpacity] = useState(1);
  // Store token pointer down time to check for a click when token is locked
  const tokenPointerDownTimeRef = useRef();
  function handlePointerDown(event) {
    if (draggable) {
      setPreventMapInteraction(true);
    }
    if (tokenState.locked && map.owner === userId) {
      tokenPointerDownTimeRef.current = event.evt.timeStamp;
    }
  }

  function handlePointerUp(event) {
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
        width={tokenWidth}
        height={tokenHeight}
        x={0}
        y={0}
        rotation={tokenState.rotation}
        offsetX={tokenWidth / 2}
        offsetY={tokenHeight / 2}
      >
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
        rotation={tokenState.rotation}
        offsetX={tokenWidth / 2}
        offsetY={tokenHeight / 2}
        hitFunc={() => {}}
      />
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
    </animated.Group>
  );
}

export default MapToken;

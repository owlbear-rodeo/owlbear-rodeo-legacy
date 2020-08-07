import React, { useContext, useState, useEffect, useRef } from "react";
import { Image as KonvaImage, Group } from "react-konva";
import { useSpring, animated } from "react-spring/konva";
import useImage from "use-image";

import useDataSource from "../../helpers/useDataSource";
import useDebounce from "../../helpers/useDebounce";
import usePrevious from "../../helpers/usePrevious";
import * as Vector2 from "../../helpers/vector2";

import AuthContext from "../../contexts/AuthContext";
import MapInteractionContext from "../../contexts/MapInteractionContext";

import TokenStatus from "../token/TokenStatus";
import TokenLabel from "../token/TokenLabel";

import { tokenSources, unknownSource } from "../../tokens";

const snappingThreshold = 1 / 5;

function MapToken({
  token,
  tokenState,
  tokenSizePercent,
  onTokenStateChange,
  onTokenMenuOpen,
  onTokenDragStart,
  onTokenDragEnd,
  draggable,
  mapState,
  fadeOnHover,
  map,
}) {
  const { userId } = useContext(AuthContext);
  const {
    setPreventMapInteraction,
    mapWidth,
    mapHeight,
    stageScale,
  } = useContext(MapInteractionContext);

  const tokenSource = useDataSource(token, tokenSources, unknownSource);
  const [tokenSourceImage, tokenSourceStatus] = useImage(tokenSource);
  const [tokenAspectRatio, setTokenAspectRatio] = useState(1);

  useEffect(() => {
    if (tokenSourceImage) {
      setTokenAspectRatio(tokenSourceImage.width / tokenSourceImage.height);
    }
  }, [tokenSourceImage]);

  function handleDragStart(event) {
    const tokenGroup = event.target;
    const tokenImage = imageRef.current;

    if (token && token.isVehicle) {
      // Find all other tokens on the map
      const layer = tokenGroup.getLayer();
      const tokens = layer.find(".token");
      for (let other of tokens) {
        if (other === tokenGroup) {
          continue;
        }
        const otherRect = other.getClientRect();
        const otherCenter = {
          x: otherRect.x + otherRect.width / 2,
          y: otherRect.y + otherRect.height / 2,
        };
        if (tokenImage.intersects(otherCenter)) {
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
      const position = {
        x: tokenGroup.x() + tokenGroup.width() / 2,
        y: tokenGroup.y() + tokenGroup.height() / 2,
      };
      const gridSize = { x: mapWidth / map.gridX, y: mapHeight / map.gridY };
      const gridSnap = Vector2.roundTo(position, gridSize);
      const gridDistance = Vector2.length(Vector2.subtract(gridSnap, position));
      const minGrid = Vector2.min(gridSize);
      if (gridDistance < minGrid * snappingThreshold) {
        tokenGroup.x(gridSnap.x - tokenGroup.width() / 2);
        tokenGroup.y(gridSnap.y - tokenGroup.height() / 2);
      }
    }
  }

  function handleDragEnd(event) {
    const tokenGroup = event.target;

    const mountChanges = {};
    if (token && token.isVehicle) {
      const parent = tokenGroup.getParent();
      const mountedTokens = tokenGroup.find(".token");
      for (let mountedToken of mountedTokens) {
        // Save and restore token position after moving layer
        const position = mountedToken.absolutePosition();
        mountedToken.moveTo(parent);
        mountedToken.absolutePosition(position);
        mountChanges[mountedToken.id()] = {
          ...mapState.tokens[mountedToken.id()],
          x: mountedToken.x() / mapWidth,
          y: mountedToken.y() / mapHeight,
          lastEditedBy: userId,
        };
      }
    }

    setPreventMapInteraction(false);
    onTokenStateChange({
      ...mountChanges,
      [tokenState.id]: {
        ...tokenState,
        x: tokenGroup.x() / mapWidth,
        y: tokenGroup.y() / mapHeight,
        lastEditedBy: userId,
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
  function handlePointerDown() {
    if (draggable) {
      setPreventMapInteraction(true);
    }
  }

  function handlePointerUp() {
    if (draggable) {
      setPreventMapInteraction(false);
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

  const tokenWidth = tokenSizePercent * mapWidth * tokenState.size;
  const tokenHeight =
    tokenSizePercent * (mapWidth / tokenAspectRatio) * tokenState.size;

  const debouncedStageScale = useDebounce(stageScale, 50);
  const imageRef = useRef();
  useEffect(() => {
    const image = imageRef.current;
    if (
      image &&
      tokenSourceStatus === "loaded" &&
      tokenWidth > 0 &&
      tokenHeight > 0
    ) {
      image.cache({
        pixelRatio: debouncedStageScale * window.devicePixelRatio,
      });
      image.drawHitFromCache();
      // Force redraw
      image.getLayer().draw();
    }
  }, [debouncedStageScale, tokenWidth, tokenHeight, tokenSourceStatus]);

  // Animate to new token positions if edited by others
  const tokenX = tokenState.x * mapWidth;
  const tokenY = tokenState.y * mapHeight;
  const previousWidth = usePrevious(mapWidth);
  const previousHeight = usePrevious(mapHeight);
  const resized = mapWidth !== previousWidth || mapHeight !== previousHeight;
  const skipAnimation = tokenState.lastEditedBy === userId || resized;
  const props = useSpring({
    x: tokenX,
    y: tokenY,
    immediate: skipAnimation,
  });

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
      opacity={tokenOpacity}
      name={token && token.isVehicle ? "vehicle" : "token"}
      id={tokenState.id}
    >
      <KonvaImage
        ref={imageRef}
        width={tokenWidth}
        height={tokenHeight}
        x={0}
        y={0}
        image={tokenSourceImage}
        rotation={tokenState.rotation}
        offsetX={tokenWidth / 2}
        offsetY={tokenHeight / 2}
      />
      <Group offsetX={tokenWidth / 2} offsetY={tokenHeight / 2}>
        <TokenStatus
          tokenState={tokenState}
          width={tokenWidth}
          height={tokenHeight}
        />
        <TokenLabel
          tokenState={tokenState}
          width={tokenWidth}
          height={tokenHeight}
        />
      </Group>
    </animated.Group>
  );
}

export default MapToken;

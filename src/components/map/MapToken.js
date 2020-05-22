import React, { useContext, useState, useEffect, useRef } from "react";
import { Image as KonvaImage, Group } from "react-konva";
import Konva from "konva";
import useImage from "use-image";

import useDataSource from "../../helpers/useDataSource";
import useDebounce from "../../helpers/useDebounce";
import usePrevious from "../../helpers/usePrevious";

import AuthContext from "../../contexts/AuthContext";
import MapInteractionContext from "../../contexts/MapInteractionContext";

import TokenStatus from "../token/TokenStatus";
import TokenLabel from "../token/TokenLabel";

import { tokenSources, unknownSource } from "../../tokens";

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
    const tokenImage = event.target;
    const tokenImageRect = tokenImage.getClientRect();

    if (token.isVehicle) {
      // Find all other tokens on the map
      const layer = tokenImage.getLayer();
      const tokens = layer.find(".token");
      for (let other of tokens) {
        if (other === tokenImage) {
          continue;
        }
        const otherRect = other.getClientRect();
        const otherCenter = {
          x: otherRect.x + otherRect.width / 2,
          y: otherRect.y + otherRect.height / 2,
        };
        // Check the other tokens center overlaps this tokens bounding box
        if (
          otherCenter.x > tokenImageRect.x &&
          otherCenter.x < tokenImageRect.x + tokenImageRect.width &&
          otherCenter.y > tokenImageRect.y &&
          otherCenter.y < tokenImageRect.y + tokenImageRect.height
        ) {
          // Save and restore token position after moving layer
          const position = other.absolutePosition();
          other.moveTo(tokenImage);
          other.absolutePosition(position);
        }
      }
    }

    onTokenDragStart(event);
  }

  function handleDragEnd(event) {
    const tokenImage = event.target;

    const mountChanges = {};
    if (token.isVehicle) {
      const layer = tokenImage.getLayer();
      const mountedTokens = tokenImage.find(".token");
      for (let mountedToken of mountedTokens) {
        // Save and restore token position after moving layer
        const position = mountedToken.absolutePosition();
        mountedToken.moveTo(layer);
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
        x: tokenImage.x() / mapWidth,
        y: tokenImage.y() / mapHeight,
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

  function handlePointerOver() {
    if (!draggable) {
      setTokenOpacity(0.5);
    }
  }

  function handlePointerOut() {
    if (!draggable) {
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
  const containerRef = useRef();
  const tokenX = tokenState.x * mapWidth;
  const tokenY = tokenState.y * mapHeight;

  const previousWidth = usePrevious(mapWidth);
  const previousHeight = usePrevious(mapHeight);
  const resized = mapWidth !== previousWidth || mapHeight !== previousHeight;
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      if (tokenState.lastEditedBy === userId || resized) {
        container.x(tokenX);
        container.y(tokenY);
      } else {
        container.to({
          x: tokenX,
          y: tokenY,
          duration: 0.3,
          easing: Konva.Easings.EaseInOut,
        });
      }
    }
  }, [tokenX, tokenY, tokenState.lastEditedBy, userId, resized]);

  return (
    <Group
      width={tokenWidth}
      height={tokenHeight}
      draggable={draggable}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseOver={handlePointerOver}
      onMouseOut={handlePointerOut}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onClick={handleClick}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      opacity={tokenOpacity}
      name={token && token.isVehicle ? "vehicle" : "token"}
      id={tokenState.id}
      ref={containerRef}
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
    </Group>
  );
}

export default MapToken;

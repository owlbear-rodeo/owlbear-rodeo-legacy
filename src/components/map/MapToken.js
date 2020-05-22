import React, { useContext, useState, useEffect, useRef } from "react";
import { Image as KonvaImage, Group } from "react-konva";
import useImage from "use-image";

import useDataSource from "../../helpers/useDataSource";
import useDebounce from "../../helpers/useDebounce";

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

  function handleDragEnd(event) {
    setPreventMapInteraction(false);
    onTokenStateChange({
      ...tokenState,
      x: event.target.x() / mapWidth,
      y: event.target.y() / mapHeight,
      lastEditedBy: userId,
    });
    onTokenDragEnd();
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
    if (image && tokenSourceStatus === "loaded") {
      image.cache({
        pixelRatio: debouncedStageScale * window.devicePixelRatio,
      });
      image.drawHitFromCache();
      // Force redraw
      image.getLayer().draw();
    }
  }, [debouncedStageScale, tokenWidth, tokenHeight, tokenSourceStatus]);

  if (!tokenWidth || !tokenHeight || tokenSourceStatus === "loading") {
    return null;
  }

  return (
    <Group
      width={tokenWidth}
      height={tokenHeight}
      x={tokenState.x * mapWidth}
      y={tokenState.y * mapHeight}
      draggable={draggable}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseOver={handlePointerOver}
      onMouseOut={handlePointerOut}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onClick={handleClick}
      onDragEnd={handleDragEnd}
      onDragStart={onTokenDragStart}
      opacity={tokenOpacity}
    >
      <KonvaImage
        ref={imageRef}
        width={tokenWidth}
        height={tokenHeight}
        x={0}
        y={0}
        image={tokenSourceImage}
      />
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
  );
}

export default MapToken;

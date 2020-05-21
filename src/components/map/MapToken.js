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
    const tokenImage = event.target;
    onTokenMenuOpen(tokenState.id, tokenImage);
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
        pixelRatio: debouncedStageScale,
      });
      image.drawHitFromCache();
      // Force redraw
      image.getLayer().draw();
    }
  }, [debouncedStageScale, tokenWidth, tokenHeight, tokenSourceStatus]);

  if (!tokenWidth || !tokenHeight) {
    return null;
  }

  return (
    <Group
      width={tokenWidth}
      height={tokenHeight}
      x={tokenState.x * mapWidth}
      y={tokenState.y * mapHeight}
      draggable
      onMouseDown={() => setPreventMapInteraction(true)}
      onMouseUp={() => setPreventMapInteraction(false)}
      onTouchStart={() => setPreventMapInteraction(true)}
      onTouchEnd={() => setPreventMapInteraction(false)}
      onClick={handleClick}
      onDragEnd={handleDragEnd}
      onDragStart={onTokenDragStart}
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

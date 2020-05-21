import React, { useContext, useState, useEffect, useRef } from "react";
import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";

import useDataSource from "../../helpers/useDataSource";
import useDebounce from "../../helpers/useDebounce";

import AuthContext from "../../contexts/AuthContext";
import MapInteractionContext from "../../contexts/MapInteractionContext";

import { tokenSources, unknownSource } from "../../tokens";

function MapToken({
  token,
  tokenState,
  tokenSizePercent,
  onTokenStateChange,
  onTokenMenuOpen,
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
    onTokenStateChange({
      ...tokenState,
      x: event.target.x() / mapWidth,
      y: event.target.y() / mapHeight,
      lastEditedBy: userId,
    });
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
    if (image) {
      image.cache({
        pixelRatio: debouncedStageScale,
      });
      image.drawHitFromCache();
      // Force redraw
      image.parent.draw();
    }
  }, [debouncedStageScale, tokenWidth, tokenHeight, tokenSourceStatus]);

  return (
    <KonvaImage
      ref={imageRef}
      width={tokenWidth}
      height={tokenHeight}
      x={tokenState.x * mapWidth}
      y={tokenState.y * mapHeight}
      image={tokenSourceImage}
      draggable
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onMouseDown={() => setPreventMapInteraction(true)}
      onMouseUp={() => setPreventMapInteraction(false)}
      onTouchStart={() => setPreventMapInteraction(true)}
      onTouchEnd={() => setPreventMapInteraction(false)}
    />
  );
}

export default MapToken;

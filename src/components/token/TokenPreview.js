import React, { useState, useRef, useEffect } from "react";
import { Box, IconButton } from "theme-ui";
import { Stage, Layer, Image, Rect, Group } from "react-konva";
import ReactResizeDetector from "react-resize-detector";
import useImage from "use-image";

import usePreventOverscroll from "../../helpers/usePreventOverscroll";
import useStageInteraction from "../../helpers/useStageInteraction";
import useDataSource from "../../helpers/useDataSource";

import GridOnIcon from "../../icons/GridOnIcon";
import GridOffIcon from "../../icons/GridOffIcon";

import { tokenSources, unknownSource } from "../../tokens";

import Grid from "../Grid";

function TokenPreview({ token }) {
  const [tokenSourceData, setTokenSourceData] = useState({});
  useEffect(() => {
    if (token.id !== tokenSourceData.id) {
      setTokenSourceData(token);
    }
  }, [token, tokenSourceData]);

  const tokenSource = useDataSource(
    tokenSourceData,
    tokenSources,
    unknownSource
  );
  const [tokenSourceImage] = useImage(tokenSource);
  const [tokenRatio, setTokenRatio] = useState(1);

  useEffect(() => {
    if (tokenSourceImage) {
      setTokenRatio(tokenSourceImage.width / tokenSourceImage.height);
    }
  }, [tokenSourceImage]);

  const [stageWidth, setStageWidth] = useState(1);
  const [stageHeight, setStageHeight] = useState(1);
  const [stageScale, setStageScale] = useState(1);

  const stageRatio = stageWidth / stageHeight;

  let tokenWidth;
  let tokenHeight;
  if (stageRatio > tokenRatio) {
    tokenWidth = tokenSourceImage
      ? stageHeight / (tokenSourceImage.height / tokenSourceImage.width)
      : stageWidth;
    tokenHeight = stageHeight;
  } else {
    tokenWidth = stageWidth;
    tokenHeight = tokenSourceImage
      ? stageWidth * (tokenSourceImage.height / tokenSourceImage.width)
      : stageHeight;
  }

  const stageTranslateRef = useRef({ x: 0, y: 0 });
  const mapLayerRef = useRef();

  function handleResize(width, height) {
    setStageWidth(width);
    setStageHeight(height);
  }

  // Reset map translate and scale
  useEffect(() => {
    const layer = mapLayerRef.current;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (layer) {
      let newTranslate;
      if (stageRatio > tokenRatio) {
        newTranslate = {
          x: -(tokenWidth - containerRect.width) / 2,
          y: 0,
        };
      } else {
        newTranslate = {
          x: 0,
          y: -(tokenHeight - containerRect.height) / 2,
        };
      }

      layer.x(newTranslate.x);
      layer.y(newTranslate.y);
      layer.draw();
      stageTranslateRef.current = newTranslate;

      setStageScale(1);
    }
  }, [token.id, tokenWidth, tokenHeight, stageRatio, tokenRatio]);

  const bind = useStageInteraction(
    mapLayerRef.current,
    stageScale,
    setStageScale,
    stageTranslateRef,
    "pan"
  );

  const containerRef = useRef();
  usePreventOverscroll(containerRef);

  const [showGridPreview, setShowGridPreview] = useState(true);
  const gridWidth = tokenWidth;
  const gridX = token.defaultSize;
  const gridSize = gridWidth / gridX;
  const gridY = Math.ceil(tokenHeight / gridSize);
  const gridHeight = gridY > 0 ? gridY * gridSize : tokenHeight;
  const borderWidth = Math.max(
    (Math.min(tokenWidth, gridHeight) / 200) * Math.max(1 / stageScale, 1),
    1
  );

  return (
    <Box
      sx={{
        width: "100%",
        height: "300px",
        cursor: "move",
        touchAction: "none",
        outline: "none",
        position: "relative",
      }}
      bg="muted"
      ref={containerRef}
      {...bind()}
    >
      <ReactResizeDetector handleWidth handleHeight onResize={handleResize}>
        <Stage
          width={stageWidth}
          height={stageHeight}
          scale={{ x: stageScale, y: stageScale }}
          x={stageWidth / 2}
          y={stageHeight / 2}
          offset={{ x: stageWidth / 2, y: stageHeight / 2 }}
        >
          <Layer ref={mapLayerRef}>
            <Image
              image={tokenSourceImage}
              width={tokenWidth}
              height={tokenHeight}
            />
            {showGridPreview && (
              <Group offsetY={gridHeight - tokenHeight}>
                <Grid
                  gridX={gridX}
                  gridY={gridY}
                  width={gridWidth}
                  height={gridHeight}
                />
                <Rect
                  width={gridWidth}
                  height={gridHeight}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.75)"
                  strokeWidth={borderWidth}
                />
              </Group>
            )}
          </Layer>
        </Stage>
      </ReactResizeDetector>
      <IconButton
        title={showGridPreview ? "Hide Grid Preview" : "Show Grid Preview"}
        aria-label={showGridPreview ? "Hide Grid Preview" : "Show Grid Preview"}
        onClick={() => setShowGridPreview(!showGridPreview)}
        bg="overlay"
        sx={{
          borderRadius: "50%",
          position: "absolute",
          bottom: 0,
          right: 0,
        }}
        m={2}
        p="6px"
      >
        {showGridPreview ? <GridOnIcon /> : <GridOffIcon />}
      </IconButton>
    </Box>
  );
}

export default TokenPreview;

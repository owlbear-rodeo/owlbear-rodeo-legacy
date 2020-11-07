import React, { useState, useRef, useEffect } from "react";
import { Box, IconButton } from "theme-ui";
import { Stage, Layer, Image, Rect, Group } from "react-konva";
import ReactResizeDetector from "react-resize-detector";
import useImage from "use-image";

import usePreventOverscroll from "../../helpers/usePreventOverscroll";
import useStageInteraction from "../../helpers/useStageInteraction";
import useDataSource from "../../helpers/useDataSource";
import useImageCenter from "../../helpers/useImageCenter";

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

  const [stageWidth, setStageWidth] = useState(1);
  const [stageHeight, setStageHeight] = useState(1);
  const [stageScale, setStageScale] = useState(1);

  const stageTranslateRef = useRef({ x: 0, y: 0 });
  const tokenStageRef = useRef();
  const tokenLayerRef = useRef();

  function handleResize(width, height) {
    setStageWidth(width);
    setStageHeight(height);
  }

  const containerRef = useRef();
  usePreventOverscroll(containerRef);

  const [tokenWidth, tokenHeight] = useImageCenter(
    token,
    tokenStageRef,
    stageWidth,
    stageHeight,
    stageTranslateRef,
    setStageScale,
    tokenLayerRef,
    containerRef,
    true
  );

  const bind = useStageInteraction(
    tokenStageRef.current,
    stageScale,
    setStageScale,
    stageTranslateRef,
    tokenLayerRef.current
  );

  const [showGridPreview, setShowGridPreview] = useState(true);
  const gridWidth = tokenWidth;
  const gridX = token.defaultSize;
  const gridSize = gridWidth / gridX;
  const gridY = Math.round(tokenHeight / gridSize);
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
          ref={tokenStageRef}
        >
          <Layer ref={tokenLayerRef}>
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

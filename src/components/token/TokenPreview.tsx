import { useState, useRef } from "react";
import { Box, IconButton } from "theme-ui";
import { Stage, Layer, Image, Rect, Group } from "react-konva";
import ReactResizeDetector from "react-resize-detector";
import useImage from "use-image";
import Konva from "konva";

import usePreventOverscroll from "../../hooks/usePreventOverscroll";
import useStageInteraction from "../../hooks/useStageInteraction";
import useImageCenter from "../../hooks/useImageCenter";
import useResponsiveLayout from "../../hooks/useResponsiveLayout";

import { GridProvider } from "../../contexts/GridContext";
import { useDataURL } from "../../contexts/AssetsContext";

import GridOnIcon from "../../icons/GridOnIcon";
import GridOffIcon from "../../icons/GridOffIcon";

import { tokenSources } from "../../tokens";

import Grid from "../konva/Grid";
import { Token } from "../../types/Token";

type TokenPreviewProps = {
  token: Token;
};

function TokenPreview({ token }: TokenPreviewProps) {
  const tokenURL = useDataURL(token, tokenSources);
  const [tokenSourceImage] = useImage(tokenURL || "");

  const [stageWidth, setStageWidth] = useState(1);
  const [stageHeight, setStageHeight] = useState(1);
  const [stageScale, setStageScale] = useState(1);

  const stageTranslateRef = useRef({ x: 0, y: 0 });
  const tokenStageRef = useRef<Konva.Stage>(null);
  const tokenLayerRef = useRef<Konva.Layer>(null);

  function handleResize(width?: number, height?: number) {
    if (width && height) {
      setStageWidth(width);
      setStageHeight(height);
    }
  }

  const containerRef = useRef<HTMLDivElement>(null);
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

  useStageInteraction(
    tokenStageRef,
    stageScale,
    setStageScale,
    stageTranslateRef,
    tokenLayerRef
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

  const layout = useResponsiveLayout();

  return (
    <Box
      sx={{
        width: "100%",
        height: layout.screenSize === "large" ? "500px" : "300px",
        cursor: "move",
        touchAction: "none",
        outline: "none",
        position: "relative",
      }}
      bg="muted"
      ref={containerRef}
    >
      <ReactResizeDetector
        handleWidth
        handleHeight
        onResize={handleResize}
        targetRef={containerRef}
      >
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
                <GridProvider
                  grid={{
                    size: { x: gridX, y: gridY },
                    inset: {
                      topLeft: { x: 0, y: 0 },
                      bottomRight: { x: 1, y: 1 },
                    },
                    type: "square",
                    measurement: { type: "chebyshev", scale: "5ft" },
                  }}
                  width={gridWidth}
                  height={gridHeight}
                >
                  <Grid />
                </GridProvider>
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

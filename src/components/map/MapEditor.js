import React, { useState, useRef, useEffect } from "react";
import { Box } from "theme-ui";
import { Stage, Layer, Image } from "react-konva";
import ReactResizeDetector from "react-resize-detector";
import useImage from "use-image";
import { useGesture } from "react-use-gesture";
import normalizeWheel from "normalize-wheel";

import useDataSource from "../../helpers/useDataSource";
import usePreventOverscroll from "../../helpers/usePreventOverscroll";

import { mapSources as defaultMapSources } from "../../maps";

const wheelZoomSpeed = -0.001;
const touchZoomSpeed = 0.005;
const minZoom = 0.1;
const maxZoom = 5;

function MapEditor({ map }) {
  const mapSource = useDataSource(map, defaultMapSources);
  const [mapSourceImage] = useImage(mapSource);

  const [stageWidth, setStageWidth] = useState(1);
  const [stageHeight, setStageHeight] = useState(1);
  const [stageScale, setStageScale] = useState(1);

  const stageRatio = stageWidth / stageHeight;
  const mapRatio = map ? map.width / map.height : 1;

  let mapWidth;
  let mapHeight;
  if (stageRatio > mapRatio) {
    mapWidth = map ? stageHeight / (map.height / map.width) : stageWidth;
    mapHeight = stageHeight;
  } else {
    mapWidth = stageWidth;
    mapHeight = map ? stageWidth * (map.height / map.width) : stageHeight;
  }

  const stageTranslateRef = useRef({ x: 0, y: 0 });
  const isInteractingWithCanvas = useRef(false);
  const pinchPreviousDistanceRef = useRef();
  const pinchPreviousOriginRef = useRef();
  const mapLayerRef = useRef();

  function handleResize(width, height) {
    setStageWidth(width);
    setStageHeight(height);
  }

  useEffect(() => {
    const layer = mapLayerRef.current;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (map && layer) {
      let newTranslate;
      if (stageRatio > mapRatio) {
        newTranslate = {
          x: -(mapWidth - containerRect.width) / 2,
          y: 0,
        };
      } else {
        newTranslate = {
          x: 0,
          y: -(mapHeight - containerRect.height) / 2,
        };
      }

      layer.x(newTranslate.x);
      layer.y(newTranslate.y);
      layer.draw();
      stageTranslateRef.current = newTranslate;

      setStageScale(1);
    }
  }, [map, mapWidth, mapHeight, stageRatio, mapRatio]);

  const bind = useGesture({
    onWheelStart: ({ event }) => {
      isInteractingWithCanvas.current =
        event.target === mapLayerRef.current.getCanvas()._canvas;
    },
    onWheel: ({ event }) => {
      event.persist();
      const { pixelY } = normalizeWheel(event);
      if (!isInteractingWithCanvas.current) {
        return;
      }
      const newScale = Math.min(
        Math.max(stageScale + pixelY * wheelZoomSpeed, minZoom),
        maxZoom
      );
      setStageScale(newScale);
    },
    onPinch: ({ da, origin, first }) => {
      const [distance] = da;
      const [originX, originY] = origin;
      if (first) {
        pinchPreviousDistanceRef.current = distance;
        pinchPreviousOriginRef.current = { x: originX, y: originY };
      }

      // Apply scale
      const distanceDelta = distance - pinchPreviousDistanceRef.current;
      const originXDelta = originX - pinchPreviousOriginRef.current.x;
      const originYDelta = originY - pinchPreviousOriginRef.current.y;
      const newScale = Math.min(
        Math.max(stageScale + distanceDelta * touchZoomSpeed, minZoom),
        maxZoom
      );
      setStageScale(newScale);

      // Apply translate
      const stageTranslate = stageTranslateRef.current;
      const layer = mapLayerRef.current;
      const newTranslate = {
        x: stageTranslate.x + originXDelta / newScale,
        y: stageTranslate.y + originYDelta / newScale,
      };
      layer.x(newTranslate.x);
      layer.y(newTranslate.y);
      layer.draw();
      stageTranslateRef.current = newTranslate;

      pinchPreviousDistanceRef.current = distance;
      pinchPreviousOriginRef.current = { x: originX, y: originY };
    },
    onDragStart: ({ event }) => {
      isInteractingWithCanvas.current =
        event.target === mapLayerRef.current.getCanvas()._canvas;
    },
    onDrag: ({ delta, pinching }) => {
      if (pinching || !isInteractingWithCanvas.current) {
        return;
      }

      const [dx, dy] = delta;
      const stageTranslate = stageTranslateRef.current;
      const layer = mapLayerRef.current;
      const newTranslate = {
        x: stageTranslate.x + dx / stageScale,
        y: stageTranslate.y + dy / stageScale,
      };
      layer.x(newTranslate.x);
      layer.y(newTranslate.y);
      layer.draw();
      stageTranslateRef.current = newTranslate;
    },
  });

  const containerRef = useRef();
  usePreventOverscroll(containerRef);

  return (
    <Box
      sx={{
        width: "100%",
        height: "300px",
        cursor: "pointer",
        touchAction: "none",
        outline: "none",
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
            <Image image={mapSourceImage} width={mapWidth} height={mapHeight} />
          </Layer>
        </Stage>
      </ReactResizeDetector>
    </Box>
  );
}

export default MapEditor;

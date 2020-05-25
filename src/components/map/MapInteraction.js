import React, { useRef, useEffect, useState, useContext } from "react";
import { Box } from "theme-ui";
import { useGesture } from "react-use-gesture";
import ReactResizeDetector from "react-resize-detector";
import useImage from "use-image";
import { Stage, Layer, Image } from "react-konva";

import usePreventOverscroll from "../../helpers/usePreventOverscroll";
import useDataSource from "../../helpers/useDataSource";

import { mapSources as defaultMapSources } from "../../maps";

import { MapInteractionProvider } from "../../contexts/MapInteractionContext";
import MapStageContext from "../../contexts/MapStageContext";
import AuthContext from "../../contexts/AuthContext";

const wheelZoomSpeed = 0.001;
const touchZoomSpeed = 0.01;
const minZoom = 0.1;
const maxZoom = 5;

function MapInteraction({ map, children, controls, selectedToolId }) {
  const mapSource = useDataSource(map, defaultMapSources);
  const [mapSourceImage] = useImage(mapSource);

  const [stageWidth, setStageWidth] = useState(1);
  const [stageHeight, setStageHeight] = useState(1);
  const [stageScale, setStageScale] = useState(1);
  // "none" | "first" | "dragging" | "last"
  const [stageDragState, setStageDragState] = useState("none");
  const [preventMapInteraction, setPreventMapInteraction] = useState(false);

  const stageWidthRef = useRef(stageWidth);
  const stageHeightRef = useRef(stageHeight);
  // Avoid state udpates when panning the map by using a ref and updating the konva element directly
  const stageTranslateRef = useRef({ x: 0, y: 0 });
  const mapDragPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const layer = mapLayerRef.current;
    if (map && layer) {
      const mapHeight = stageWidthRef.current * (map.height / map.width);
      const newTranslate = {
        x: 0,
        y: -(mapHeight - stageHeightRef.current) / 2,
      };
      layer.x(newTranslate.x);
      layer.y(newTranslate.y);
      layer.draw();
      stageTranslateRef.current = newTranslate;
    }
  }, [map]);

  // Convert a client space XY to be normalized to the map image
  function getMapDragPosition(xy) {
    const [x, y] = xy;
    const container = containerRef.current;
    const mapImage = mapImageRef.current;
    if (container && mapImage) {
      const containerRect = container.getBoundingClientRect();
      const mapRect = mapImage.getClientRect();

      const offsetX = x - containerRect.left - mapRect.x;
      const offsetY = y - containerRect.top - mapRect.y;

      const normalizedX = offsetX / mapRect.width;
      const normalizedY = offsetY / mapRect.height;

      return { x: normalizedX, y: normalizedY };
    }
  }

  const bind = useGesture({
    onWheel: ({ delta }) => {
      const newScale = Math.min(
        Math.max(stageScale + delta[1] * wheelZoomSpeed, minZoom),
        maxZoom
      );
      setStageScale(newScale);
    },
    onPinch: ({ offset }) => {
      const [d] = offset;
      const newScale = Math.min(
        Math.max(1 + d * touchZoomSpeed, minZoom),
        maxZoom
      );
      setStageScale(newScale);
    },
    onDrag: ({ delta, xy, first, last }) => {
      if (preventMapInteraction) {
        return;
      }

      const [dx, dy] = delta;
      const stageTranslate = stageTranslateRef.current;
      const layer = mapLayerRef.current;
      if (selectedToolId === "pan") {
        const newTranslate = {
          x: stageTranslate.x + dx / stageScale,
          y: stageTranslate.y + dy / stageScale,
        };
        layer.x(newTranslate.x);
        layer.y(newTranslate.y);
        layer.draw();
        stageTranslateRef.current = newTranslate;
      }
      mapDragPositionRef.current = getMapDragPosition(xy);
      const newDragState = first ? "first" : last ? "last" : "dragging";
      if (stageDragState !== newDragState) {
        setStageDragState(newDragState);
      }
    },
    onDragEnd: () => {
      setStageDragState("none");
    },
  });

  function handleResize(width, height) {
    setStageWidth(width);
    setStageHeight(height);
    stageWidthRef.current = width;
    stageHeightRef.current = height;
  }

  function getCursorForTool(tool) {
    switch (tool) {
      case "pan":
        return "move";
      case "fog":
      case "brush":
      case "shape":
        return "crosshair";
      default:
        return "default";
    }
  }

  const containerRef = useRef();
  usePreventOverscroll(containerRef);

  const mapWidth = stageWidth;
  const mapHeight = map ? stageWidth * (map.height / map.width) : stageHeight;

  const mapStageRef = useContext(MapStageContext);
  const mapLayerRef = useRef();
  const mapImageRef = useRef();

  const auth = useContext(AuthContext);

  const mapInteraction = {
    stageScale,
    stageWidth,
    stageHeight,
    stageDragState,
    setPreventMapInteraction,
    mapWidth,
    mapHeight,
    mapDragPositionRef,
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        position: "relative",
        cursor: getCursorForTool(selectedToolId),
        touchAction: "none",
      }}
      ref={containerRef}
      {...bind()}
      className="map"
    >
      <ReactResizeDetector handleWidth handleHeight onResize={handleResize}>
        <Stage
          width={stageWidth}
          height={stageHeight}
          scale={{ x: stageScale, y: stageScale }}
          x={stageWidth / 2}
          y={stageHeight / 2}
          offset={{ x: stageWidth / 2, y: stageHeight / 2 }}
          ref={mapStageRef}
        >
          <Layer ref={mapLayerRef}>
            <Image
              image={mapSourceImage}
              width={mapWidth}
              height={mapHeight}
              id="mapImage"
              ref={mapImageRef}
            />
            {/* Forward auth context to konva elements */}
            <AuthContext.Provider value={auth}>
              <MapInteractionProvider value={mapInteraction}>
                {children}
              </MapInteractionProvider>
            </AuthContext.Provider>
          </Layer>
        </Stage>
      </ReactResizeDetector>
      <MapInteractionProvider value={mapInteraction}>
        {controls}
      </MapInteractionProvider>
    </Box>
  );
}

export default MapInteraction;

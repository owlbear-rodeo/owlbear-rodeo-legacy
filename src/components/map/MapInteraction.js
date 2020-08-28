import React, { useRef, useEffect, useState, useContext } from "react";
import { Box } from "theme-ui";
import { useGesture } from "react-use-gesture";
import ReactResizeDetector from "react-resize-detector";
import useImage from "use-image";
import { Stage, Layer, Image } from "react-konva";
import { EventEmitter } from "events";

import usePreventOverscroll from "../../helpers/usePreventOverscroll";
import useDataSource from "../../helpers/useDataSource";

import { mapSources as defaultMapSources } from "../../maps";

import { MapInteractionProvider } from "../../contexts/MapInteractionContext";
import MapStageContext, {
  MapStageProvider,
} from "../../contexts/MapStageContext";
import AuthContext from "../../contexts/AuthContext";

const wheelZoomSpeed = -0.001;
const touchZoomSpeed = 0.005;
const minZoom = 0.1;
const maxZoom = 5;

function MapInteraction({
  map,
  children,
  controls,
  selectedToolId,
  onSelectedToolChange,
  disabledControls,
}) {
  let mapSourceMap = map;
  if (map && map.type === "file" && map.resolutions) {
    // Set to the quality if available
    if (map.quality !== "original" && map.resolutions[map.quality]) {
      mapSourceMap = map.resolutions[map.quality];
    } else if (!map.file) {
      // If no file fallback to the highest resolution
      for (let resolution in map.resolutions) {
        mapSourceMap = map.resolutions[resolution];
      }
    }
  }

  const mapSource = useDataSource(mapSourceMap, defaultMapSources);
  const [mapSourceImage, mapSourceImageStatus] = useImage(mapSource);

  // Create a map source that only updates when the image is fully loaded
  const [loadedMapSourceImage, setLoadedMapSourceImage] = useState();
  useEffect(() => {
    if (mapSourceImageStatus === "loaded") {
      setLoadedMapSourceImage(mapSourceImage);
    }
  }, [mapSourceImage, mapSourceImageStatus]);

  // Map loaded taking in to account different resolutions
  const [mapLoaded, setMapLoaded] = useState(false);
  useEffect(() => {
    if (map === null) {
      setMapLoaded(false);
    }
    if (mapSourceImageStatus === "loaded") {
      setMapLoaded(true);
    }
  }, [mapSourceImageStatus, map]);

  const [stageWidth, setStageWidth] = useState(1);
  const [stageHeight, setStageHeight] = useState(1);
  const [stageScale, setStageScale] = useState(1);
  const [preventMapInteraction, setPreventMapInteraction] = useState(false);

  const stageWidthRef = useRef(stageWidth);
  const stageHeightRef = useRef(stageHeight);
  // Avoid state udpates when panning the map by using a ref and updating the konva element directly
  const stageTranslateRef = useRef({ x: 0, y: 0 });

  // Reset transform when map changes
  const previousMapIdRef = useRef();
  useEffect(() => {
    const layer = mapLayerRef.current;
    const previousMapId = previousMapIdRef.current;
    if (map && layer && previousMapId !== map.id) {
      const mapHeight = stageWidthRef.current * (map.height / map.width);
      const newTranslate = {
        x: 0,
        y: -(mapHeight - stageHeightRef.current) / 2,
      };
      layer.x(newTranslate.x);
      layer.y(newTranslate.y);
      layer.draw();
      stageTranslateRef.current = newTranslate;

      setStageScale(1);
    }
    previousMapIdRef.current = map && map.id;
  }, [map]);

  const pinchPreviousDistanceRef = useRef();
  const pinchPreviousOriginRef = useRef();
  const isInteractingWithCanvas = useRef(false);
  const previousSelectedToolRef = useRef(selectedToolId);

  const [interactionEmitter] = useState(new EventEmitter());

  const bind = useGesture({
    onWheelStart: ({ event }) => {
      isInteractingWithCanvas.current =
        event.target === mapLayerRef.current.getCanvas()._canvas;
    },
    onWheel: ({ delta }) => {
      if (preventMapInteraction || !isInteractingWithCanvas.current) {
        return;
      }
      const newScale = Math.min(
        Math.max(stageScale + delta[1] * wheelZoomSpeed, minZoom),
        maxZoom
      );
      setStageScale(newScale);
    },
    onPinchStart: () => {
      // Change to pan tool when pinching and zooming
      previousSelectedToolRef.current = selectedToolId;
      onSelectedToolChange("pan");
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
    onPinchEnd: () => {
      onSelectedToolChange(previousSelectedToolRef.current);
    },
    onDragStart: ({ event }) => {
      isInteractingWithCanvas.current =
        event.target === mapLayerRef.current.getCanvas()._canvas;
    },
    onDrag: ({ delta, first, last, pinching }) => {
      if (
        preventMapInteraction ||
        pinching ||
        !isInteractingWithCanvas.current
      ) {
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
      if (first) {
        interactionEmitter.emit("dragStart");
      } else if (last) {
        interactionEmitter.emit("dragEnd");
      } else {
        interactionEmitter.emit("drag");
      }
    },
  });

  function handleResize(width, height) {
    setStageWidth(width);
    setStageHeight(height);
    stageWidthRef.current = width;
    stageHeightRef.current = height;
  }

  // Added key events to interaction emitter
  useEffect(() => {
    function handleKeyDown(event) {
      // Ignore text input
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      interactionEmitter.emit("keyDown", event);
    }

    function handleKeyUp(event) {
      // Ignore text input
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      interactionEmitter.emit("keyUp", event);
    }

    document.body.addEventListener("keydown", handleKeyDown);
    document.body.addEventListener("keyup", handleKeyUp);
    document.body.tabIndex = 1;
    return () => {
      document.body.removeEventListener("keydown", handleKeyDown);
      document.body.removeEventListener("keyup", handleKeyUp);
      document.body.tabIndex = 0;
    };
  }, [interactionEmitter]);

  // Create default keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event) {
      // Change to pan tool when pressing space
      if (event.key === " " && selectedToolId === "pan") {
        // Stop active state on pan icon from being selected
        event.preventDefault();
      }
      if (
        event.key === " " &&
        selectedToolId !== "pan" &&
        !disabledControls.includes("pan")
      ) {
        event.preventDefault();
        previousSelectedToolRef.current = selectedToolId;
        onSelectedToolChange("pan");
      }

      // Basic keyboard shortcuts
      if (event.key === "w" && !disabledControls.includes("pan")) {
        onSelectedToolChange("pan");
      }
      if (event.key === "d" && !disabledControls.includes("drawing")) {
        onSelectedToolChange("drawing");
      }
      if (event.key === "f" && !disabledControls.includes("fog")) {
        onSelectedToolChange("fog");
      }
      if (event.key === "m" && !disabledControls.includes("measure")) {
        onSelectedToolChange("measure");
      }
      if (event.key === "q" && !disabledControls.includes("pointer")) {
        onSelectedToolChange("pointer");
      }
    }

    function handleKeyUp(event) {
      if (event.key === " " && selectedToolId === "pan") {
        onSelectedToolChange(previousSelectedToolRef.current);
      }
    }

    interactionEmitter.on("keyDown", handleKeyDown);
    interactionEmitter.on("keyUp", handleKeyUp);
    return () => {
      interactionEmitter.off("keyDown", handleKeyDown);
      interactionEmitter.off("keyUp", handleKeyUp);
    };
  }, [
    interactionEmitter,
    onSelectedToolChange,
    disabledControls,
    selectedToolId,
  ]);

  function getCursorForTool(tool) {
    switch (tool) {
      case "pan":
        return "move";
      case "fog":
      case "drawing":
      case "measure":
      case "pointer":
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
    setPreventMapInteraction,
    mapWidth,
    mapHeight,
    interactionEmitter,
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        position: "relative",
        cursor: getCursorForTool(selectedToolId),
        touchAction: "none",
        outline: "none",
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
              image={mapLoaded && loadedMapSourceImage}
              width={mapWidth}
              height={mapHeight}
              id="mapImage"
              ref={mapImageRef}
            />
            {/* Forward auth context to konva elements */}
            <AuthContext.Provider value={auth}>
              <MapInteractionProvider value={mapInteraction}>
                <MapStageProvider value={mapStageRef}>
                  {mapLoaded && children}
                </MapStageProvider>
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

import React, { useRef, useEffect, useState, useContext } from "react";
import { Box } from "theme-ui";
import ReactResizeDetector from "react-resize-detector";
import { Stage, Layer, Image } from "react-konva";
import { EventEmitter } from "events";

import useMapImage from "../../helpers/useMapImage";
import usePreventOverscroll from "../../helpers/usePreventOverscroll";
import useKeyboard from "../../helpers/useKeyboard";
import useStageInteraction from "../../helpers/useStageInteraction";

import { MapInteractionProvider } from "../../contexts/MapInteractionContext";
import MapStageContext, {
  MapStageProvider,
} from "../../contexts/MapStageContext";
import AuthContext from "../../contexts/AuthContext";
import SettingsContext from "../../contexts/SettingsContext";
import KeyboardContext from "../../contexts/KeyboardContext";

function MapInteraction({
  map,
  children,
  controls,
  selectedToolId,
  onSelectedToolChange,
  disabledControls,
}) {
  const [mapImageSource, mapImageSourceStatus] = useMapImage(map);

  // Map loaded taking in to account different resolutions
  const [mapLoaded, setMapLoaded] = useState(false);
  useEffect(() => {
    if (map === null) {
      setMapLoaded(false);
    }
    if (mapImageSourceStatus === "loaded") {
      setMapLoaded(true);
    }
  }, [mapImageSourceStatus, map]);

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

  function handleResize(width, height) {
    setStageWidth(width);
    setStageHeight(height);
    stageWidthRef.current = width;
    stageHeightRef.current = height;
  }

  const mapStageRef = useContext(MapStageContext);
  const mapLayerRef = useRef();
  const mapImageRef = useRef();

  const previousSelectedToolRef = useRef(selectedToolId);

  const [interactionEmitter] = useState(new EventEmitter());

  const bind = useStageInteraction(
    mapLayerRef.current,
    stageScale,
    setStageScale,
    stageTranslateRef,
    selectedToolId,
    preventMapInteraction,
    {
      onPinchStart: () => {
        // Change to pan tool when pinching and zooming
        previousSelectedToolRef.current = selectedToolId;
        onSelectedToolChange("pan");
      },
      onPinchEnd: () => {
        onSelectedToolChange(previousSelectedToolRef.current);
      },
      onDrag: ({ first, last }) => {
        if (first) {
          interactionEmitter.emit("dragStart");
        } else if (last) {
          interactionEmitter.emit("dragEnd");
        } else {
          interactionEmitter.emit("drag");
        }
      },
    }
  );

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

  useKeyboard(handleKeyDown, handleKeyUp);
  // Get keyboard context to pass to Konva
  const keyboardValue = useContext(KeyboardContext);

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

  const auth = useContext(AuthContext);
  const settings = useContext(SettingsContext);

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
              image={mapLoaded && mapImageSource}
              width={mapWidth}
              height={mapHeight}
              id="mapImage"
              ref={mapImageRef}
            />
            {/* Forward auth context to konva elements */}
            <AuthContext.Provider value={auth}>
              <SettingsContext.Provider value={settings}>
                <KeyboardContext.Provider value={keyboardValue}>
                  <MapInteractionProvider value={mapInteraction}>
                    <MapStageProvider value={mapStageRef}>
                      {mapLoaded && children}
                    </MapStageProvider>
                  </MapInteractionProvider>
                </KeyboardContext.Provider>
              </SettingsContext.Provider>
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

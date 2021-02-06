import React, { useRef, useEffect, useState, useContext } from "react";
import { Box } from "theme-ui";
import ReactResizeDetector from "react-resize-detector";
import { Stage, Layer, Image } from "react-konva";
import { EventEmitter } from "events";

import useMapImage from "../../hooks/useMapImage";
import usePreventOverscroll from "../../hooks/usePreventOverscroll";
import useStageInteraction from "../../hooks/useStageInteraction";
import useImageCenter from "../../hooks/useImageCenter";

import { getGridMaxZoom } from "../../helpers/grid";

import { MapInteractionProvider } from "../../contexts/MapInteractionContext";
import { MapStageProvider, useMapStage } from "../../contexts/MapStageContext";
import AuthContext, { useAuth } from "../../contexts/AuthContext";
import SettingsContext, { useSettings } from "../../contexts/SettingsContext";
import KeyboardContext from "../../contexts/KeyboardContext";
import { GridProvider } from "../../contexts/GridContext";
import { useKeyboard } from "../../contexts/KeyboardContext";

function MapInteraction({
  map,
  mapState,
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
    if (
      !map ||
      !mapState ||
      (map.type === "file" && !map.file && !map.resolutions) ||
      mapState.mapId !== map.id
    ) {
      setMapLoaded(false);
    } else if (mapImageSourceStatus === "loaded") {
      setMapLoaded(true);
    }
  }, [mapImageSourceStatus, map, mapState]);

  const [stageWidth, setStageWidth] = useState(1);
  const [stageHeight, setStageHeight] = useState(1);
  const [stageScale, setStageScale] = useState(1);
  const [preventMapInteraction, setPreventMapInteraction] = useState(false);

  // Avoid state udpates when panning the map by using a ref and updating the konva element directly
  const stageTranslateRef = useRef({ x: 0, y: 0 });
  const mapStageRef = useMapStage();
  const mapLayerRef = useRef();
  const mapImageRef = useRef();

  function handleResize(width, height) {
    if (width > 0 && height > 0) {
      setStageWidth(width);
      setStageHeight(height);
    }
  }

  const containerRef = useRef();
  usePreventOverscroll(containerRef);

  const [mapWidth, mapHeight] = useImageCenter(
    map,
    mapStageRef,
    stageWidth,
    stageHeight,
    stageTranslateRef,
    setStageScale,
    mapLayerRef,
    containerRef
  );

  const previousSelectedToolRef = useRef(selectedToolId);

  const [interactionEmitter] = useState(new EventEmitter());

  const bind = useStageInteraction(
    mapStageRef.current,
    stageScale,
    setStageScale,
    stageTranslateRef,
    mapLayerRef.current,
    getGridMaxZoom(map?.grid),
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
    if (event.key === "n" && !disabledControls.includes("note")) {
      onSelectedToolChange("note");
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
        return settings.settings[tool].type === "move"
          ? "pointer"
          : "crosshair";
      case "measure":
      case "pointer":
      case "note":
        return "crosshair";
      default:
        return "default";
    }
  }

  const auth = useAuth();
  const settings = useSettings();

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
                    <GridProvider
                      grid={map?.grid}
                      width={mapWidth}
                      height={mapHeight}
                    >
                      <MapStageProvider value={mapStageRef}>
                        {mapLoaded && children}
                      </MapStageProvider>
                    </GridProvider>
                  </MapInteractionProvider>
                </KeyboardContext.Provider>
              </SettingsContext.Provider>
            </AuthContext.Provider>
          </Layer>
        </Stage>
      </ReactResizeDetector>
      <MapInteractionProvider value={mapInteraction}>
        <GridProvider grid={map?.grid} width={mapWidth} height={mapHeight}>
          {controls}
        </GridProvider>
      </MapInteractionProvider>
    </Box>
  );
}

export default MapInteraction;

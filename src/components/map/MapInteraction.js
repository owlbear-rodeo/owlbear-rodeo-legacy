import React, { useRef, useEffect, useState } from "react";
import { Box } from "theme-ui";
import ReactResizeDetector from "react-resize-detector";
import { Stage, Layer, Image } from "react-konva";
import { EventEmitter } from "events";

import useMapImage from "../../hooks/useMapImage";
import usePreventOverscroll from "../../hooks/usePreventOverscroll";
import useStageInteraction from "../../hooks/useStageInteraction";
import useImageCenter from "../../hooks/useImageCenter";

import { getGridMaxZoom } from "../../helpers/grid";
import KonvaBridge from "../../helpers/KonvaBridge";

import { MapInteractionProvider } from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
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

  useStageInteraction(
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
        // Change to move tool when pinching and zooming
        previousSelectedToolRef.current = selectedToolId;
        onSelectedToolChange("move");
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
    // Change to move tool when pressing space
    if (event.key === " " && selectedToolId === "move") {
      // Stop active state on move icon from being selected
      event.preventDefault();
    }
    if (
      event.key === " " &&
      selectedToolId !== "move" &&
      !disabledControls.includes("move")
    ) {
      event.preventDefault();
      previousSelectedToolRef.current = selectedToolId;
      onSelectedToolChange("move");
    }

    // Basic keyboard shortcuts
    if (event.key === "w" && !disabledControls.includes("move")) {
      onSelectedToolChange("move");
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
    if (event.key === " " && selectedToolId === "move") {
      onSelectedToolChange(previousSelectedToolRef.current);
    }
  }

  useKeyboard(handleKeyDown, handleKeyUp);

  function getCursorForTool(tool) {
    switch (tool) {
      case "move":
        return "move";
      case "fog":
      case "drawing":
        return "crosshair";
      case "measure":
      case "pointer":
      case "note":
        return "crosshair";
      default:
        return "default";
    }
  }

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
    <MapInteractionProvider value={mapInteraction}>
      <GridProvider grid={map?.grid} width={mapWidth} height={mapHeight}>
        <Box
          sx={{
            flexGrow: 1,
            position: "relative",
            cursor: getCursorForTool(selectedToolId),
            touchAction: "none",
            outline: "none",
          }}
          ref={containerRef}
          className="map"
        >
          <ReactResizeDetector handleWidth handleHeight onResize={handleResize}>
            <KonvaBridge
              stageRender={(children) => (
                <Stage
                  width={stageWidth}
                  height={stageHeight}
                  scale={{ x: stageScale, y: stageScale }}
                  ref={mapStageRef}
                >
                  {children}
                </Stage>
              )}
            >
              <Layer ref={mapLayerRef}>
                <Image
                  image={mapLoaded && mapImageSource}
                  width={mapWidth}
                  height={mapHeight}
                  id="mapImage"
                  ref={mapImageRef}
                />

                {mapLoaded && children}
              </Layer>
            </KonvaBridge>
          </ReactResizeDetector>
          {controls}
        </Box>
      </GridProvider>
    </MapInteractionProvider>
  );
}

export default MapInteraction;

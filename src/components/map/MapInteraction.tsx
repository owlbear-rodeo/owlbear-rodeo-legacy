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

import shortcuts from "../../shortcuts";
import { Layer as LayerType } from "konva/types/Layer";
import { Image as ImageType } from "konva/types/shapes/Image";
import { Map, MapToolId } from "../../types/Map";
import { MapState } from "../../types/MapState";

type SelectedToolChangeEventHanlder = (tool: MapToolId) => void;

type MapInteractionProps = {
  map: Map;
  mapState: MapState;
  children?: React.ReactNode;
  controls: React.ReactNode;
  selectedToolId: MapToolId;
  onSelectedToolChange: SelectedToolChangeEventHanlder;
  disabledControls: MapToolId[];
};

function MapInteraction({
  map,
  mapState,
  children,
  controls,
  selectedToolId,
  onSelectedToolChange,
  disabledControls,
}: MapInteractionProps) {
  const [mapImage, mapImageStatus] = useMapImage(map);

  const [mapLoaded, setMapLoaded] = useState(false);
  useEffect(() => {
    if (!map || !mapState || mapState.mapId !== map.id) {
      setMapLoaded(false);
    } else if (mapImageStatus === "loaded") {
      setMapLoaded(true);
    }
  }, [mapImageStatus, map, mapState]);

  const [stageWidth, setStageWidth] = useState(1);
  const [stageHeight, setStageHeight] = useState(1);
  const [stageScale, setStageScale] = useState(1);
  const [preventMapInteraction, setPreventMapInteraction] = useState(false);

  // Avoid state udpates when panning the map by using a ref and updating the konva element directly
  const stageTranslateRef = useRef({ x: 0, y: 0 });
  const mapStageRef = useMapStage();
  const mapLayerRef = useRef<LayerType>(null);
  const mapImageRef = useRef<ImageType>(null);

  function handleResize(width?: number, height?: number) {
    if (width && height && width > 0 && height > 0) {
      setStageWidth(width);
      setStageHeight(height);
    }
  }

  const containerRef = useRef<HTMLDivElement>(null);
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
    mapStageRef,
    stageScale,
    setStageScale,
    stageTranslateRef,
    mapLayerRef,
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

  function handleKeyDown(event: KeyboardEvent) {
    // Change to move tool when pressing space
    if (shortcuts.move(event) && selectedToolId === "move") {
      // Stop active state on move icon from being selected
      event.preventDefault();
    }
    if (
      shortcuts.move(event) &&
      selectedToolId !== "move" &&
      !disabledControls.includes("move")
    ) {
      event.preventDefault();
      previousSelectedToolRef.current = selectedToolId;
      onSelectedToolChange("move");
    }

    // Basic keyboard shortcuts
    if (shortcuts.moveTool(event) && !disabledControls.includes("move")) {
      onSelectedToolChange("move");
    }
    if (shortcuts.drawingTool(event) && !disabledControls.includes("drawing")) {
      onSelectedToolChange("drawing");
    }
    if (shortcuts.fogTool(event) && !disabledControls.includes("fog")) {
      onSelectedToolChange("fog");
    }
    if (shortcuts.measureTool(event) && !disabledControls.includes("measure")) {
      onSelectedToolChange("measure");
    }
    if (shortcuts.pointerTool(event) && !disabledControls.includes("pointer")) {
      onSelectedToolChange("pointer");
    }
    if (shortcuts.noteTool(event) && !disabledControls.includes("note")) {
      onSelectedToolChange("note");
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (shortcuts.move(event) && selectedToolId === "move") {
      onSelectedToolChange(previousSelectedToolRef.current);
    }
  }

  useKeyboard(handleKeyDown, handleKeyUp);

  function getCursorForTool(tool: MapToolId) {
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
            position: "relative",
            cursor: getCursorForTool(selectedToolId),
            touchAction: "none",
            outline: "none",
            width: "100%",
            height: "100%",
          }}
          ref={containerRef}
          className="map"
        >
          <ReactResizeDetector handleWidth handleHeight onResize={handleResize}>
            <KonvaBridge
              stageRender={(children) => (
                <Stage
                  // @ts-ignore
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
                  image={mapLoaded && mapImage}
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

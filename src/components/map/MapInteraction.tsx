import React, { useRef, useEffect, useState } from "react";
import { Box } from "theme-ui";
import ReactResizeDetector from "react-resize-detector";
import { Stage, Layer, Image, Group } from "react-konva";
import Konva from "konva";
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
import { Map, MapToolId } from "../../types/Map";
import { MapState } from "../../types/MapState";

type SelectedToolChangeEventHanlder = (tool: MapToolId) => void;

type MapInteractionProps = {
  map: Map | null;
  mapState: MapState | null;
  children?: React.ReactNode;
  controls: React.ReactNode;
  selectedToolId: MapToolId;
  onSelectedToolChange: SelectedToolChangeEventHanlder;
};

function MapInteraction({
  map,
  mapState,
  children,
  controls,
  selectedToolId,
  onSelectedToolChange,
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
  const mapLayerRef = useRef<Konva.Layer>(null);
  const mapImageRef = useRef<Konva.Image>(null);

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
    if (map && shortcuts.move(event) && selectedToolId !== "move") {
      event.preventDefault();
      previousSelectedToolRef.current = selectedToolId;
      onSelectedToolChange("move");
    }
    if (!event.repeat && shortcuts.move(event) && selectedToolId === "move") {
      previousSelectedToolRef.current = "move";
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
      case "select":
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
      <GridProvider
        grid={map?.grid || null}
        width={mapWidth}
        height={mapHeight}
      >
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
          <ReactResizeDetector
            handleWidth
            handleHeight
            onResize={handleResize}
            targetRef={containerRef}
          >
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
                  image={(mapLoaded && mapImage) || undefined}
                  width={mapWidth}
                  height={mapHeight}
                  id="mapImage"
                  ref={mapImageRef}
                />
                {mapLoaded && children}
                <Group id="portal" />
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

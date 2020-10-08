import React, { useState, useRef, useEffect } from "react";
import { Box, IconButton } from "theme-ui";
import { Stage, Layer, Image } from "react-konva";
import ReactResizeDetector from "react-resize-detector";

import useMapImage from "../../helpers/useMapImage";
import usePreventOverscroll from "../../helpers/usePreventOverscroll";
import useStageInteraction from "../../helpers/useStageInteraction";
import { getMapDefaultInset } from "../../helpers/map";

import { MapInteractionProvider } from "../../contexts/MapInteractionContext";

import ResetMapIcon from "../../icons/ResetMapIcon";
import GridOnIcon from "../../icons/GridOnIcon";
import GridOffIcon from "../../icons/GridOffIcon";

import MapGrid from "./MapGrid";
import MapGridEditor from "./MapGridEditor";

function MapEditor({ map, onSettingsChange }) {
  const [mapImageSource] = useMapImage(map);

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

  const defaultInset = getMapDefaultInset(
    map.width,
    map.height,
    map.grid.size.x,
    map.grid.size.y
  );

  const stageTranslateRef = useRef({ x: 0, y: 0 });
  const mapLayerRef = useRef();
  const [preventMapInteraction, setPreventMapInteraction] = useState(false);

  function handleResize(width, height) {
    setStageWidth(width);
    setStageHeight(height);
  }

  // Reset map translate and scale
  useEffect(() => {
    const layer = mapLayerRef.current;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (layer) {
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
  }, [map.id, mapWidth, mapHeight, stageRatio, mapRatio]);

  const bind = useStageInteraction(
    mapLayerRef.current,
    stageScale,
    setStageScale,
    stageTranslateRef,
    "pan",
    preventMapInteraction
  );

  const containerRef = useRef();
  usePreventOverscroll(containerRef);

  function handleGridChange(inset) {
    onSettingsChange("grid", {
      ...map.grid,
      inset,
    });
  }

  function handleMapReset() {
    onSettingsChange("grid", {
      ...map.grid,
      inset: defaultInset,
    });
  }

  const [showGridControls, setShowGridControls] = useState(true);

  const mapInteraction = {
    stageScale,
    stageWidth,
    stageHeight,
    setPreventMapInteraction,
    mapWidth,
    mapHeight,
  };

  const gridChanged =
    map.grid.inset.topLeft.x !== defaultInset.topLeft.x ||
    map.grid.inset.topLeft.y !== defaultInset.topLeft.y ||
    map.grid.inset.bottomRight.x !== defaultInset.bottomRight.x ||
    map.grid.inset.bottomRight.y !== defaultInset.bottomRight.y;

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
          x={stageWidth / 2}
          y={stageHeight / 2}
          offset={{ x: stageWidth / 2, y: stageHeight / 2 }}
        >
          <Layer ref={mapLayerRef}>
            <Image image={mapImageSource} width={mapWidth} height={mapHeight} />
            <MapInteractionProvider value={mapInteraction}>
              {showGridControls && <MapGrid map={map} strokeWidth={0.5} />}
              {showGridControls && (
                <MapGridEditor map={map} onGridChange={handleGridChange} />
              )}
            </MapInteractionProvider>
          </Layer>
        </Stage>
      </ReactResizeDetector>
      {gridChanged && (
        <IconButton
          title="Reset Grid"
          aria-label="Reset Grid"
          onClick={handleMapReset}
          bg="overlay"
          sx={{ borderRadius: "50%", position: "absolute", bottom: 0, left: 0 }}
          m={2}
        >
          <ResetMapIcon />
        </IconButton>
      )}
      <IconButton
        title={showGridControls ? "Hide Grid Controls" : "Show Grid Controls"}
        aria-label={
          showGridControls ? "Hide Grid Controls" : "Show Grid Controls"
        }
        onClick={() => setShowGridControls(!showGridControls)}
        bg="overlay"
        sx={{ borderRadius: "50%", position: "absolute", bottom: 0, right: 0 }}
        m={2}
        p="6px"
      >
        {showGridControls ? <GridOnIcon /> : <GridOffIcon />}
      </IconButton>
    </Box>
  );
}

export default MapEditor;

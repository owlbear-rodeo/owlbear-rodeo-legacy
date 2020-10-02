import React, { useState, useRef, useEffect } from "react";
import { Box } from "theme-ui";
import { Stage, Layer, Image } from "react-konva";
import ReactResizeDetector from "react-resize-detector";

import useMapImage from "../../helpers/useMapImage";
import usePreventOverscroll from "../../helpers/usePreventOverscroll";
import useStageInteraction from "../../helpers/useStageInteraction";

function MapEditor({ map }) {
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

  const stageTranslateRef = useRef({ x: 0, y: 0 });
  const mapLayerRef = useRef();

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
    stageTranslateRef
  );

  const containerRef = useRef();
  usePreventOverscroll(containerRef);

  return (
    <Box
      sx={{
        width: "100%",
        height: "300px",
        cursor: "move",
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
            <Image image={mapImageSource} width={mapWidth} height={mapHeight} />
          </Layer>
        </Stage>
      </ReactResizeDetector>
    </Box>
  );
}

export default MapEditor;

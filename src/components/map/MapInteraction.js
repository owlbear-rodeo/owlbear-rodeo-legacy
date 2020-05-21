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

const zoomSpeed = -0.001;
const minZoom = 0.1;
const maxZoom = 5;

function MapInteraction({ map, children, controls }) {
  const mapSource = useDataSource(map, defaultMapSources);
  const [mapSourceImage] = useImage(mapSource);

  const [stageWidth, setStageWidth] = useState(1);
  const [stageHeight, setStageHeight] = useState(1);
  const [stageScale, setStageScale] = useState(1);
  const [stageTranslate, setStageTranslate] = useState({ x: 0, y: 0 });
  const [preventMapInteraction, setPreventMapInteraction] = useState(false);

  const stageWidthRef = useRef(stageWidth);
  const stageHeightRef = useRef(stageHeight);
  const stageScaleRef = useRef(stageScale);
  const stageTranslateRef = useRef(stageTranslate);

  useEffect(() => {
    if (map) {
      const mapHeight = stageWidthRef.current * (map.height / map.width);
      setStageTranslate({ x: 0, y: -(mapHeight - stageHeightRef.current) / 2 });
    }
  }, [map]);

  const bind = useGesture({
    onWheel: ({ delta }) => {
      const newScale = Math.min(
        Math.max(stageScale - delta[1] * zoomSpeed, minZoom),
        maxZoom
      );
      setStageScale(newScale);
      stageScaleRef.current = newScale;
    },
    onDrag: ({ delta }) => {
      if (!preventMapInteraction) {
        const newTranslate = {
          x: stageTranslate.x + delta[0] / stageScale,
          y: stageTranslate.y + delta[1] / stageScale,
        };
        setStageTranslate(newTranslate);
        stageTranslateRef.current = newTranslate;
      }
    },
  });

  function handleResize(width, height) {
    setStageWidth(width);
    setStageHeight(height);
    stageWidthRef.current = width;
    stageHeightRef.current = height;
  }

  const containerRef = useRef();
  usePreventOverscroll(containerRef);

  const mapWidth = stageWidth;
  const mapHeight = map ? stageWidth * (map.height / map.width) : stageHeight;

  const mapStageRef = useContext(MapStageContext);

  const auth = useContext(AuthContext);

  const mapInteraction = {
    stageTranslate,
    stageScale,
    stageWidth,
    stageHeight,
    setPreventMapInteraction,
    mapWidth,
    mapHeight,
  };

  return (
    <Box
      sx={{ flexGrow: 1, position: "relative" }}
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
          <Layer x={stageTranslate.x} y={stageTranslate.y}>
            <Image
              image={mapSourceImage}
              width={mapWidth}
              height={mapHeight}
              id="mapImage"
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

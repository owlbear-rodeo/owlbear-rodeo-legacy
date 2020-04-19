import React, { useRef, useEffect, useState } from "react";
import { Box, Image } from "theme-ui";
import interact from "interactjs";

import ProxyToken from "./ProxyToken";
import TokenMenu from "./TokenMenu";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";
import MapControls from "./MapControls";

import { omit } from "../helpers/shared";

const mapTokenClassName = "map-token";
const zoomSpeed = -0.005;
const minZoom = 0.1;
const maxZoom = 5;

function Map({
  mapSource,
  mapData,
  tokens,
  onMapTokenChange,
  onMapTokenRemove,
  onMapChange,
  onMapDraw,
  onMapDrawUndo,
  onMapDrawRedo,
  drawActions,
  drawActionIndex,
}) {
  function handleProxyDragEnd(isOnMap, token) {
    if (isOnMap && onMapTokenChange) {
      onMapTokenChange(token);
    }

    if (!isOnMap && onMapTokenRemove) {
      onMapTokenRemove(token);
    }
  }

  /**
   * Map drawing
   */

  const [selectedTool, setSelectedTool] = useState("pan");

  const [drawnShapes, setDrawnShapes] = useState([]);
  function handleShapeAdd(shape) {
    onMapDraw({ type: "add", shape });
  }

  function handleShapeRemove(shapeId) {
    onMapDraw({ type: "remove", shapeId });
  }

  // Replay the draw actions and convert them to shapes for the map drawing
  useEffect(() => {
    let shapesById = {};
    for (let i = 0; i <= drawActionIndex; i++) {
      const action = drawActions[i];
      if (action.type === "add") {
        shapesById[action.shape.id] = action.shape;
      }
      if (action.type === "remove") {
        shapesById = omit(shapesById, [action.shapeId]);
      }
    }
    setDrawnShapes(Object.values(shapesById));
  }, [drawActions, drawActionIndex]);

  const disabledTools = [];
  if (!mapData) {
    disabledTools.push("pan");
    disabledTools.push("brush");
  }
  if (drawnShapes.length === 0) {
    disabledTools.push("erase");
  }

  /**
   * Map movement
   */

  const mapTranslateRef = useRef({ x: 0, y: 0 });
  const mapScaleRef = useRef(1);
  const mapMoveContainerRef = useRef();
  function setTranslateAndScale(newTranslate, newScale) {
    const moveContainer = mapMoveContainerRef.current;
    moveContainer.style.transform = `translate(${newTranslate.x}px, ${newTranslate.y}px) scale(${newScale})`;
    mapScaleRef.current = newScale;
    mapTranslateRef.current = newTranslate;
  }

  useEffect(() => {
    function handleMove(event) {
      const scale = mapScaleRef.current;
      const translate = mapTranslateRef.current;

      let newScale = scale;
      let newTranslate = translate;

      if (event.ds) {
        newScale = Math.max(Math.min(scale + event.ds, maxZoom), minZoom);
      }

      if (selectedTool === "pan") {
        newTranslate = {
          x: translate.x + event.dx,
          y: translate.y + event.dy,
        };
      }
      setTranslateAndScale(newTranslate, newScale);
    }
    interact(".map")
      .gesturable({
        listeners: {
          move: handleMove,
        },
      })
      .draggable({
        inertia: true,
        listeners: {
          move: handleMove,
        },
      });
    interact(".map").on("doubletap", (event) => {
      event.preventDefault();
      setTranslateAndScale({ x: 0, y: 0 }, 1);
    });
  }, [selectedTool]);

  // Reset map transform when map changes
  useEffect(() => {
    setTranslateAndScale({ x: 0, y: 0 }, 1);
  }, [mapSource]);

  // Bind the wheel event of the map via a ref
  // in order to support non-passive event listening
  // to allow the track pad zoom to be interrupted
  // see https://github.com/facebook/react/issues/14856
  useEffect(() => {
    const mapContainer = mapContainerRef.current;

    function handleZoom(event) {
      // Stop overscroll on chrome and safari
      // also stop pinch to zoom on chrome
      event.preventDefault();

      const scale = mapScaleRef.current;
      const translate = mapTranslateRef.current;

      const deltaY = event.deltaY * zoomSpeed;
      const newScale = Math.max(Math.min(scale + deltaY, maxZoom), minZoom);

      setTranslateAndScale(translate, newScale);
    }

    if (mapContainer) {
      mapContainer.addEventListener("wheel", handleZoom, {
        passive: false,
      });
    }

    return () => {
      if (mapContainer) {
        mapContainer.removeEventListener("wheel", handleZoom);
      }
    };
  }, []);

  /**
   * Member setup
   */

  const mapRef = useRef(null);
  const mapContainerRef = useRef();
  const rows = mapData && mapData.rows;
  const tokenSizePercent = (1 / rows) * 100;
  const aspectRatio = (mapData && mapData.width / mapData.height) || 1;

  const mapImage = (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <Image
        ref={mapRef}
        className="mapImage"
        sx={{
          width: "100%",
          userSelect: "none",
          touchAction: "none",
        }}
        src={mapSource}
      />
    </Box>
  );

  const mapTokens = (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {Object.values(tokens).map((token) => (
        <MapToken
          key={token.id}
          token={token}
          tokenSizePercent={tokenSizePercent}
          className={mapTokenClassName}
        />
      ))}
    </Box>
  );

  return (
    <>
      <Box
        className="map"
        sx={{
          flexGrow: 1,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          userSelect: "none",
          touchAction: "none",
        }}
        bg="background"
        ref={mapContainerRef}
      >
        <Box
          sx={{
            position: "relative",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Box ref={mapMoveContainerRef}>
            <Box
              sx={{
                width: "100%",
                height: 0,
                paddingBottom: `${(1 / aspectRatio) * 100}%`,
              }}
            />
            {mapImage}
            {mapTokens}
            <MapDrawing
              width={mapData ? mapData.width : 0}
              height={mapData ? mapData.height : 0}
              selectedTool={selectedTool}
              shapes={drawnShapes}
              onShapeAdd={handleShapeAdd}
              onShapeRemove={handleShapeRemove}
            />
          </Box>
        </Box>
        <MapControls
          onMapChange={onMapChange}
          onToolChange={setSelectedTool}
          selectedTool={selectedTool}
          disabledTools={disabledTools}
          onUndo={onMapDrawUndo}
          onRedo={onMapDrawRedo}
          undoDisabled={drawActionIndex < 0}
          redoDisabled={drawActionIndex === drawActions.length - 1}
        />
      </Box>
      <ProxyToken
        tokenClassName={mapTokenClassName}
        onProxyDragEnd={handleProxyDragEnd}
      />
      <TokenMenu
        tokenClassName={mapTokenClassName}
        onTokenChange={onMapTokenChange}
      />
    </>
  );
}

export default Map;

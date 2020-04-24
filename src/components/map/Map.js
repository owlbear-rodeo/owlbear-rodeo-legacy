import React, { useRef, useEffect, useState } from "react";
import { Box, Image } from "theme-ui";
import interact from "interactjs";

import ProxyToken from "../token/ProxyToken";
import TokenMenu from "../token/TokenMenu";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";
import MapControls from "./MapControls";

import { omit } from "../../helpers/shared";
import useDataSource from "../../helpers/useDataSource";
import { mapSources as defaultMapSources } from "../../maps";

const mapTokenProxyClassName = "map-token__proxy";
const mapTokenMenuClassName = "map-token__menu";
const zoomSpeed = -0.005;
const minZoom = 0.1;
const maxZoom = 5;

function Map({
  map,
  mapState,
  tokens,
  onMapTokenStateChange,
  onMapTokenStateRemove,
  onMapChange,
  onMapStateChange,
  onMapDraw,
  onMapDrawUndo,
  onMapDrawRedo,
}) {
  const mapSource = useDataSource(map, defaultMapSources);

  function handleProxyDragEnd(isOnMap, tokenState) {
    if (isOnMap && onMapTokenStateChange) {
      onMapTokenStateChange(tokenState);
    }

    if (!isOnMap && onMapTokenStateRemove) {
      onMapTokenStateRemove(tokenState);
    }
  }

  /**
   * Map drawing
   */

  const [selectedTool, setSelectedTool] = useState("pan");
  const [brushColor, setBrushColor] = useState("black");
  const [useBrushGridSnapping, setUseBrushGridSnapping] = useState(false);
  const [useBrushBlending, setUseBrushBlending] = useState(false);
  const [useBrushGesture, setUseBrushGesture] = useState(false);

  const [drawnShapes, setDrawnShapes] = useState([]);
  function handleShapeAdd(shape) {
    onMapDraw({ type: "add", shapes: [shape] });
  }

  function handleShapeRemove(shapeId) {
    onMapDraw({ type: "remove", shapeIds: [shapeId] });
  }

  function handleShapeRemoveAll() {
    onMapDraw({ type: "remove", shapeIds: drawnShapes.map((s) => s.id) });
  }

  // Replay the draw actions and convert them to shapes for the map drawing
  useEffect(() => {
    if (!mapState) {
      return;
    }
    let shapesById = {};
    for (let i = 0; i <= mapState.drawActionIndex; i++) {
      const action = mapState.drawActions[i];
      if (action.type === "add") {
        for (let shape of action.shapes) {
          shapesById[shape.id] = shape;
        }
      }
      if (action.type === "remove") {
        shapesById = omit(shapesById, action.shapeIds);
      }
    }
    setDrawnShapes(Object.values(shapesById));
  }, [mapState]);

  const disabledTools = [];
  if (!map) {
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
    function handleMove(event, isGesture) {
      const scale = mapScaleRef.current;
      const translate = mapTranslateRef.current;

      let newScale = scale;
      let newTranslate = translate;

      if (isGesture) {
        newScale = Math.max(Math.min(scale + event.ds, maxZoom), minZoom);
      }

      if (selectedTool === "pan" || isGesture) {
        newTranslate = {
          x: translate.x + event.dx,
          y: translate.y + event.dy,
        };
      }
      setTranslateAndScale(newTranslate, newScale);
    }
    const mapInteract = interact(".map")
      .gesturable({
        listeners: {
          move: (e) => handleMove(e, true),
        },
      })
      .draggable({
        inertia: true,
        listeners: {
          move: (e) => handleMove(e, false),
        },
        cursorChecker: () => {
          return selectedTool === "pan" && map ? "move" : "default";
        },
      })
      .on("doubletap", (event) => {
        event.preventDefault();
        if (selectedTool === "pan") {
          setTranslateAndScale({ x: 0, y: 0 }, 1);
        }
      });

    return () => {
      mapInteract.unset();
    };
  }, [selectedTool, map]);

  // Reset map transform when map changes
  useEffect(() => {
    setTranslateAndScale({ x: 0, y: 0 }, 1);
  }, [map]);

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
  const gridX = map && map.gridX;
  const gridY = map && map.gridY;
  const gridSizeNormalized = { x: 1 / gridX || 0, y: 1 / gridY || 0 };
  const tokenSizePercent = gridSizeNormalized.x * 100;
  const aspectRatio = (map && map.width / map.height) || 1;

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
        pointerEvents: "none",
      }}
    >
      {mapState &&
        Object.values(mapState.tokens).map((tokenState) => (
          <MapToken
            key={tokenState.id}
            token={tokens.find((token) => token.id === tokenState.tokenId)}
            tokenState={tokenState}
            tokenSizePercent={tokenSizePercent}
            className={`${mapTokenProxyClassName} ${mapTokenMenuClassName}`}
          />
        ))}
    </Box>
  );

  const mapDrawing = (
    <MapDrawing
      width={map ? map.width : 0}
      height={map ? map.height : 0}
      selectedTool={selectedTool}
      shapes={drawnShapes}
      onShapeAdd={handleShapeAdd}
      onShapeRemove={handleShapeRemove}
      brushColor={brushColor}
      useGridSnapping={useBrushGridSnapping}
      gridSize={gridSizeNormalized}
      useBrushBlending={useBrushBlending}
      useBrushGesture={useBrushGesture}
    />
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
            {map && mapImage}
            {map && mapDrawing}
            {map && mapTokens}
          </Box>
        </Box>
        <MapControls
          onMapChange={onMapChange}
          onMapStateChange={onMapStateChange}
          currentMap={map}
          onToolChange={setSelectedTool}
          selectedTool={selectedTool}
          disabledTools={disabledTools}
          onUndo={onMapDrawUndo}
          onRedo={onMapDrawRedo}
          undoDisabled={!mapState || mapState.drawActionIndex < 0}
          redoDisabled={
            !mapState ||
            mapState.drawActionIndex === mapState.drawActions.length - 1
          }
          brushColor={brushColor}
          onBrushColorChange={setBrushColor}
          onEraseAll={handleShapeRemoveAll}
          useBrushGridSnapping={useBrushGridSnapping}
          onBrushGridSnappingChange={setUseBrushGridSnapping}
          useBrushBlending={useBrushBlending}
          onBrushBlendingChange={setUseBrushBlending}
          useBrushGesture={useBrushGesture}
          onBrushGestureChange={setUseBrushGesture}
        />
      </Box>
      <ProxyToken
        tokenClassName={mapTokenProxyClassName}
        onProxyDragEnd={handleProxyDragEnd}
        tokens={mapState && mapState.tokens}
      />
      <TokenMenu
        tokenClassName={mapTokenMenuClassName}
        onTokenChange={onMapTokenStateChange}
        tokens={mapState && mapState.tokens}
      />
    </>
  );
}

export default Map;

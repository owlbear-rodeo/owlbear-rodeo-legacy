import React, { useRef, useEffect, useState } from "react";
import { Box, Image } from "theme-ui";
import interact from "interactjs";

import ProxyToken from "./ProxyToken";
import TokenMenu from "./TokenMenu";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";
import MapControls from "./MapControls";

import { omit } from "../helpers/shared";

const mapTokenProxyClassName = "map-token__proxy";
const mapTokenMenuClassName = "map-token__menu";
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
  const [brushColor, setBrushColor] = useState("black");
  const [useBrushGridSnapping, setUseBrushGridSnapping] = useState(false);

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
    let shapesById = {};
    for (let i = 0; i <= drawActionIndex; i++) {
      const action = drawActions[i];
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
          return selectedTool === "pan" && mapData ? "move" : "default";
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
  }, [selectedTool, mapData]);

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
  const gridX = mapData && mapData.gridX;
  const gridY = mapData && mapData.gridY;
  const gridSizeNormalized = { x: 1 / gridX || 0, y: 1 / gridY || 0 };
  const tokenSizePercent = gridSizeNormalized.x * 100;
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
        pointerEvents: "none",
      }}
    >
      {Object.values(tokens).map((token) => (
        <MapToken
          key={token.id}
          token={token}
          tokenSizePercent={tokenSizePercent}
          className={`${mapTokenProxyClassName} ${mapTokenMenuClassName}`}
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
            <MapDrawing
              width={mapData ? mapData.width : 0}
              height={mapData ? mapData.height : 0}
              selectedTool={selectedTool}
              shapes={drawnShapes}
              onShapeAdd={handleShapeAdd}
              onShapeRemove={handleShapeRemove}
              brushColor={brushColor}
              useGridSnapping={useBrushGridSnapping}
              gridSize={gridSizeNormalized}
            />
            {mapTokens}
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
          brushColor={brushColor}
          onBrushColorChange={setBrushColor}
          onEraseAll={handleShapeRemoveAll}
          useBrushGridSnapping={useBrushGridSnapping}
          onBrushGridSnappingChange={setUseBrushGridSnapping}
        />
      </Box>
      <ProxyToken
        tokenClassName={mapTokenProxyClassName}
        onProxyDragEnd={handleProxyDragEnd}
      />
      <TokenMenu
        tokenClassName={mapTokenMenuClassName}
        onTokenChange={onMapTokenChange}
      />
    </>
  );
}

export default Map;

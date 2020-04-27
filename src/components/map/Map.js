import React, { useRef, useEffect, useState } from "react";
import { Box, Image } from "theme-ui";

import ProxyToken from "../token/ProxyToken";
import TokenMenu from "../token/TokenMenu";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";
import MapControls from "./MapControls";

import { omit } from "../../helpers/shared";
import useDataSource from "../../helpers/useDataSource";
import MapInteraction from "./MapInteraction";

import { mapSources as defaultMapSources } from "../../maps";

const mapTokenProxyClassName = "map-token__proxy";
const mapTokenMenuClassName = "map-token__menu";

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
  allowDrawing,
  allowTokenChange,
  allowMapChange,
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

  const [selectedToolId, setSelectedToolId] = useState("pan");
  const [toolSettings, setToolSettings] = useState({
    fog: { type: "add", useGridSnapping: false, useEdgeSnapping: true },
    brush: {
      color: "darkGray",
      type: "stroke",
      useBlending: false,
      useGridSnapping: false,
    },
    shape: {
      color: "red",
      type: "rectangle",
      useBlending: true,
      useGridSnapping: false,
    },
  });
  function handleToolSettingChange(tool, change) {
    setToolSettings((prevSettings) => ({
      ...prevSettings,
      [tool]: {
        ...prevSettings[tool],
        ...change,
      },
    }));
  }

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

  const disabledControls = [];
  if (!allowMapChange) {
    disabledControls.push("map");
  }
  if (!allowDrawing) {
    disabledControls.push("drawing");
  }
  if (!map) {
    disabledControls.push("pan");
    disabledControls.push("brush");
  }
  if (drawnShapes.length === 0) {
    disabledControls.push("erase");
  }
  if (!mapState || mapState.drawActionIndex < 0) {
    disabledControls.push("undo");
  }
  if (
    !mapState ||
    mapState.drawActionIndex === mapState.drawActions.length - 1
  ) {
    disabledControls.push("redo");
  }

  /**
   * Member setup
   */

  const mapRef = useRef(null);

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
      selectedTool={selectedToolId}
      toolSettings={toolSettings[selectedToolId]}
      shapes={drawnShapes}
      onShapeAdd={handleShapeAdd}
      onShapeRemove={handleShapeRemove}
      gridSize={gridSizeNormalized}
    />
  );

  const mapControls = (
    <MapControls
      onMapChange={onMapChange}
      onMapStateChange={onMapStateChange}
      currentMap={map}
      onSelectedToolChange={setSelectedToolId}
      selectedToolId={selectedToolId}
      toolSettings={toolSettings}
      onToolSettingChange={handleToolSettingChange}
      disabledControls={disabledControls}
      onUndo={onMapDrawUndo}
      onRedo={onMapDrawRedo}
    />
  );
  return (
    <>
      <MapInteraction
        map={map}
        aspectRatio={aspectRatio}
        isEnabled={selectedToolId === "pan"}
        controls={(allowMapChange || allowDrawing) && mapControls}
      >
        {map && mapImage}
        {map && mapDrawing}
        {map && mapTokens}
      </MapInteraction>
      {allowTokenChange && (
        <>
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
      )}
    </>
  );
}

export default Map;

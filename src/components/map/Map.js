import React, { useState, useContext, useEffect } from "react";

import MapControls from "./MapControls";

import MapInteraction from "./MapInteraction";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";

import TokenDataContext from "../../contexts/TokenDataContext";
import TokenMenu from "../token/TokenMenu";
import TokenDragOverlay from "../token/TokenDragOverlay";

import { omit } from "../../helpers/shared";

function Map({
  map,
  mapState,
  onMapTokenStateChange,
  onMapTokenStateRemove,
  onMapChange,
  onMapStateChange,
  onMapDraw,
  onMapDrawUndo,
  onMapDrawRedo,
  onFogDraw,
  onFogDrawUndo,
  onFogDrawRedo,
  allowMapDrawing,
  allowFogDrawing,
  disabledTokens,
  loading,
}) {
  const { tokens } = useContext(TokenDataContext);

  const gridX = map && map.gridX;
  const gridY = map && map.gridY;
  const gridSizeNormalized = { x: 1 / gridX || 0, y: 1 / gridY || 0 };
  const tokenSizePercent = gridSizeNormalized.x;

  const [selectedToolId, setSelectedToolId] = useState("pan");
  const [toolSettings, setToolSettings] = useState({
    fog: { type: "add", useEdgeSnapping: true, useGridSnapping: false },
    brush: {
      color: "darkGray",
      type: "stroke",
      useBlending: false,
    },
    shape: {
      color: "red",
      type: "rectangle",
      useBlending: true,
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

  function handleToolAction(action) {
    if (action === "eraseAll") {
      onMapDraw({
        type: "remove",
        shapeIds: mapShapes.map((s) => s.id),
        timestamp: Date.now(),
      });
    }
    if (action === "mapUndo") {
      onMapDrawUndo();
    }
    if (action === "mapRedo") {
      onMapDrawRedo();
    }
    if (action === "fogUndo") {
      onFogDrawUndo();
    }
    if (action === "fogRedo") {
      onFogDrawRedo();
    }
  }

  const [mapShapes, setMapShapes] = useState([]);
  const [fogShapes, setFogShapes] = useState([]);

  // Replay the draw actions and convert them to shapes for the map drawing
  useEffect(() => {
    if (!mapState) {
      return;
    }
    function actionsToShapes(actions, actionIndex) {
      let shapesById = {};
      for (let i = 0; i <= actionIndex; i++) {
        const action = actions[i];
        if (action.type === "add" || action.type === "edit") {
          for (let shape of action.shapes) {
            shapesById[shape.id] = shape;
          }
        }
        if (action.type === "remove") {
          shapesById = omit(shapesById, action.shapeIds);
        }
      }
      return Object.values(shapesById);
    }

    setMapShapes(
      actionsToShapes(mapState.mapDrawActions, mapState.mapDrawActionIndex)
    );
    setFogShapes(
      actionsToShapes(mapState.fogDrawActions, mapState.fogDrawActionIndex)
    );
  }, [mapState]);

  function handleMapShapeAdd(shape) {
    onMapDraw({ type: "add", shapes: [shape] });
  }

  function handleMapShapeRemove(shapeId) {
    onMapDraw({ type: "remove", shapeIds: [shapeId] });
  }

  const disabledControls = [];
  if (!allowMapDrawing) {
    disabledControls.push("brush");
    disabledControls.push("shape");
    disabledControls.push("erase");
  }
  if (!map) {
    disabledControls.push("pan");
  }
  if (mapShapes.length === 0) {
    disabledControls.push("erase");
  }
  if (!allowFogDrawing) {
    disabledControls.push("fog");
  }

  const disabledSettings = { fog: [], brush: [], shape: [], erase: [] };
  if (!mapState || mapState.mapDrawActionIndex < 0) {
    disabledSettings.brush.push("undo");
    disabledSettings.shape.push("undo");
    disabledSettings.erase.push("undo");
  }
  if (
    !mapState ||
    mapState.mapDrawActionIndex === mapState.mapDrawActions.length - 1
  ) {
    disabledSettings.brush.push("redo");
    disabledSettings.shape.push("redo");
    disabledSettings.erase.push("redo");
  }
  if (fogShapes.length === 0) {
    disabledSettings.fog.push("undo");
  }
  if (
    !mapState ||
    mapState.fogDrawActionIndex === mapState.fogDrawActions.length - 1
  ) {
    disabledSettings.fog.push("redo");
  }

  const mapControls = (
    <MapControls
      onMapChange={onMapChange}
      onMapStateChange={onMapStateChange}
      currentMap={map}
      currentMapState={mapState}
      onSelectedToolChange={setSelectedToolId}
      selectedToolId={selectedToolId}
      toolSettings={toolSettings}
      onToolSettingChange={handleToolSettingChange}
      onToolAction={handleToolAction}
      disabledControls={disabledControls}
      disabledSettings={disabledSettings}
    />
  );

  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const [tokenMenuOptions, setTokenMenuOptions] = useState({});
  const [draggingTokenState, setDraggingTokenState] = useState();
  function handleTokenMenuOpen(tokenStateId, tokenImage) {
    setTokenMenuOptions({ tokenStateId, tokenImage });
    setIsTokenMenuOpen(true);
  }

  const mapTokens =
    mapState &&
    Object.values(mapState.tokens).map((tokenState) => (
      <MapToken
        key={tokenState.id}
        token={tokens.find((token) => token.id === tokenState.tokenId)}
        tokenState={tokenState}
        tokenSizePercent={tokenSizePercent}
        onTokenStateChange={onMapTokenStateChange}
        onTokenMenuOpen={handleTokenMenuOpen}
        onTokenDragStart={() => setDraggingTokenState(tokenState)}
        onTokenDragEnd={() => setDraggingTokenState(null)}
      />
    ));

  const tokenMenu = (
    <TokenMenu
      isOpen={isTokenMenuOpen}
      onRequestClose={() => setIsTokenMenuOpen(false)}
      onTokenChange={onMapTokenStateChange}
      tokenState={mapState && mapState.tokens[tokenMenuOptions.tokenStateId]}
      tokenImage={tokenMenuOptions.tokenImage}
    />
  );

  const tokenDragOverlay = draggingTokenState && (
    <TokenDragOverlay
      onTokenStateRemove={() => {
        onMapTokenStateRemove(draggingTokenState);
        setDraggingTokenState(null);
      }}
    />
  );

  const mapDrawing = (
    <MapDrawing
      shapes={mapShapes}
      onShapeAdd={handleMapShapeAdd}
      onShapeRemove={handleMapShapeRemove}
      selectedToolId={selectedToolId}
      selectedToolSettings={toolSettings[selectedToolId]}
      gridSize={gridSizeNormalized}
    />
  );

  return (
    <MapInteraction
      map={map}
      controls={
        <>
          {mapControls}
          {tokenMenu}
          {tokenDragOverlay}
        </>
      }
      selectedToolId={selectedToolId}
    >
      {mapDrawing}
      {mapTokens}
    </MapInteraction>
  );
}

export default Map;

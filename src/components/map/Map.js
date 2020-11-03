import React, { useState, useContext, useEffect } from "react";
import { Group } from "react-konva";

import MapControls from "./MapControls";
import MapInteraction from "./MapInteraction";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";
import MapFog from "./MapFog";
import MapGrid from "./MapGrid";
import MapMeasure from "./MapMeasure";
import MapLoadingOverlay from "./MapLoadingOverlay";
import NetworkedMapPointer from "../../network/NetworkedMapPointer";
import MapNotes from "./MapNotes";

import TokenDataContext from "../../contexts/TokenDataContext";
import SettingsContext from "../../contexts/SettingsContext";

import TokenMenu from "../token/TokenMenu";
import TokenDragOverlay from "../token/TokenDragOverlay";

import { drawActionsToShapes } from "../../helpers/drawing";

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
  allowMapChange,
  disabledTokens,
  session,
}) {
  const { tokensById } = useContext(TokenDataContext);

  const gridX = map && map.grid.size.x;
  const gridY = map && map.grid.size.y;
  const inset = map && map.grid.inset;
  const gridSizeNormalized = {
    x: gridX ? (inset.bottomRight.x - inset.topLeft.x) / gridX : 0,
    y: gridY ? (inset.bottomRight.y - inset.topLeft.y) / gridY : 0,
  };
  const tokenSizePercent = gridSizeNormalized.x;

  const [selectedToolId, setSelectedToolId] = useState("pan");
  const { settings, setSettings } = useContext(SettingsContext);

  function handleToolSettingChange(tool, change) {
    setSettings((prevSettings) => ({
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

  function handleMapShapeAdd(shape) {
    onMapDraw({ type: "add", shapes: [shape] });
  }

  function handleMapShapesRemove(shapeIds) {
    onMapDraw({ type: "remove", shapeIds });
  }

  const [fogShapes, setFogShapes] = useState([]);

  function handleFogShapeAdd(shape) {
    onFogDraw({ type: "add", shapes: [shape] });
  }

  function handleFogShapeSubtract(shape) {
    onFogDraw({ type: "subtract", shapes: [shape] });
  }

  function handleFogShapesRemove(shapeIds) {
    onFogDraw({ type: "remove", shapeIds });
  }

  function handleFogShapesEdit(shapes) {
    onFogDraw({ type: "edit", shapes });
  }

  // Replay the draw actions and convert them to shapes for the map drawing
  useEffect(() => {
    if (!mapState) {
      return;
    }
    setMapShapes(
      drawActionsToShapes(mapState.mapDrawActions, mapState.mapDrawActionIndex)
    );
    setFogShapes(
      drawActionsToShapes(mapState.fogDrawActions, mapState.fogDrawActionIndex)
    );
  }, [mapState]);

  const disabledControls = [];
  if (!allowMapDrawing) {
    disabledControls.push("drawing");
  }
  if (!map) {
    disabledControls.push("pan");
    disabledControls.push("measure");
    disabledControls.push("pointer");
    disabledControls.push("note");
  }
  if (!allowFogDrawing) {
    disabledControls.push("fog");
  }
  if (!allowMapChange) {
    disabledControls.push("map");
  }

  const disabledSettings = { fog: [], drawing: [] };
  if (mapShapes.length === 0) {
    disabledSettings.drawing.push("erase");
  }
  if (!mapState || mapState.mapDrawActionIndex < 0) {
    disabledSettings.drawing.push("undo");
  }
  if (
    !mapState ||
    mapState.mapDrawActionIndex === mapState.mapDrawActions.length - 1
  ) {
    disabledSettings.drawing.push("redo");
  }
  if (!mapState || mapState.fogDrawActionIndex < 0) {
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
      toolSettings={settings}
      onToolSettingChange={handleToolSettingChange}
      onToolAction={handleToolAction}
      disabledControls={disabledControls}
      disabledSettings={disabledSettings}
    />
  );

  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const [tokenMenuOptions, setTokenMenuOptions] = useState({});
  const [draggingTokenOptions, setDraggingTokenOptions] = useState();
  function handleTokenMenuOpen(tokenStateId, tokenImage) {
    setTokenMenuOptions({ tokenStateId, tokenImage });
    setIsTokenMenuOpen(true);
  }

  function getMapTokenCategoryWeight(category) {
    switch (category) {
      case "character":
        return 0;
      case "vehicle":
        return 1;
      case "prop":
        return 2;
      default:
        return 0;
    }
  }

  // Sort so vehicles render below other tokens
  function sortMapTokenStates(a, b, draggingTokenOptions) {
    const tokenA = tokensById[a.tokenId];
    const tokenB = tokensById[b.tokenId];
    if (tokenA && tokenB) {
      // If categories are different sort in order "prop", "vehicle", "character"
      if (tokenB.category !== tokenA.category) {
        const aWeight = getMapTokenCategoryWeight(tokenA.category);
        const bWeight = getMapTokenCategoryWeight(tokenB.category);
        return bWeight - aWeight;
      } else if (
        draggingTokenOptions &&
        draggingTokenOptions.dragging &&
        draggingTokenOptions.tokenState.id === a.id
      ) {
        // If dragging token a move above
        return 1;
      } else if (
        draggingTokenOptions &&
        draggingTokenOptions.dragging &&
        draggingTokenOptions.tokenState.id === b.id
      ) {
        // If dragging token b move above
        return -1;
      } else {
        // Else sort so last modified is on top
        return a.lastModified - b.lastModified;
      }
    } else if (tokenA) {
      return 1;
    } else if (tokenB) {
      return -1;
    } else {
      return 0;
    }
  }

  const mapTokens = map && mapState && (
    <Group>
      {Object.values(mapState.tokens)
        .sort((a, b) => sortMapTokenStates(a, b, draggingTokenOptions))
        .map((tokenState) => (
          <MapToken
            key={tokenState.id}
            token={tokensById[tokenState.tokenId]}
            tokenState={tokenState}
            tokenSizePercent={tokenSizePercent}
            onTokenStateChange={onMapTokenStateChange}
            onTokenMenuOpen={handleTokenMenuOpen}
            onTokenDragStart={(e) =>
              setDraggingTokenOptions({
                dragging: true,
                tokenState,
                tokenGroup: e.target,
              })
            }
            onTokenDragEnd={() =>
              setDraggingTokenOptions({
                ...draggingTokenOptions,
                dragging: false,
              })
            }
            draggable={
              selectedToolId === "pan" &&
              !(tokenState.id in disabledTokens) &&
              !tokenState.locked
            }
            mapState={mapState}
            fadeOnHover={selectedToolId === "drawing"}
            map={map}
          />
        ))}
    </Group>
  );

  const tokenMenu = (
    <TokenMenu
      isOpen={isTokenMenuOpen}
      onRequestClose={() => setIsTokenMenuOpen(false)}
      onTokenStateChange={onMapTokenStateChange}
      tokenState={mapState && mapState.tokens[tokenMenuOptions.tokenStateId]}
      tokenImage={tokenMenuOptions.tokenImage}
      map={map}
    />
  );

  const tokenDragOverlay = draggingTokenOptions && (
    <TokenDragOverlay
      onTokenStateRemove={(state) => {
        onMapTokenStateRemove(state);
        setDraggingTokenOptions(null);
      }}
      onTokenStateChange={onMapTokenStateChange}
      tokenState={draggingTokenOptions && draggingTokenOptions.tokenState}
      tokenGroup={draggingTokenOptions && draggingTokenOptions.tokenGroup}
      dragging={draggingTokenOptions && draggingTokenOptions.dragging}
      token={tokensById[draggingTokenOptions.tokenState.tokenId]}
      mapState={mapState}
    />
  );

  const mapDrawing = (
    <MapDrawing
      map={map}
      shapes={mapShapes}
      onShapeAdd={handleMapShapeAdd}
      onShapesRemove={handleMapShapesRemove}
      active={selectedToolId === "drawing"}
      toolSettings={settings.drawing}
      gridSize={gridSizeNormalized}
    />
  );

  const mapFog = (
    <MapFog
      map={map}
      shapes={fogShapes}
      onShapeAdd={handleFogShapeAdd}
      onShapeSubtract={handleFogShapeSubtract}
      onShapesRemove={handleFogShapesRemove}
      onShapesEdit={handleFogShapesEdit}
      active={selectedToolId === "fog"}
      toolSettings={settings.fog}
      gridSize={gridSizeNormalized}
      transparent={allowFogDrawing && !settings.fog.preview}
    />
  );

  const mapGrid = map && map.showGrid && <MapGrid map={map} />;

  const mapMeasure = (
    <MapMeasure
      map={map}
      active={selectedToolId === "measure"}
      gridSize={gridSizeNormalized}
      selectedToolSettings={settings[selectedToolId]}
    />
  );

  const mapPointer = (
    <NetworkedMapPointer
      active={selectedToolId === "pointer"}
      gridSize={gridSizeNormalized}
      session={session}
    />
  );

  const mapNotes = (
    <MapNotes
      map={map}
      active={selectedToolId === "note"}
      gridSize={gridSizeNormalized}
      selectedToolSettings={settings[selectedToolId]}
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
          <MapLoadingOverlay />
        </>
      }
      selectedToolId={selectedToolId}
      onSelectedToolChange={setSelectedToolId}
      disabledControls={disabledControls}
    >
      {mapGrid}
      {mapNotes}
      {mapDrawing}
      {mapTokens}
      {mapFog}
      {mapPointer}
      {mapMeasure}
    </MapInteraction>
  );
}

export default Map;

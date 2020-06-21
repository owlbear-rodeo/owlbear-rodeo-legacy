import React, { useState, useContext, useEffect } from "react";
import polygonClipping from "polygon-clipping";

import MapControls from "./MapControls";
import MapInteraction from "./MapInteraction";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";
import MapFog from "./MapFog";
import MapDice from "./MapDice";
import MapGrid from "./MapGrid";

import TokenDataContext from "../../contexts/TokenDataContext";
import MapLoadingContext from "../../contexts/MapLoadingContext";

import TokenMenu from "../token/TokenMenu";
import TokenDragOverlay from "../token/TokenDragOverlay";
import LoadingOverlay from "../LoadingOverlay";

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
}) {
  const { tokensById } = useContext(TokenDataContext);
  const { isLoading } = useContext(MapLoadingContext);

  const gridX = map && map.gridX;
  const gridY = map && map.gridY;
  const gridSizeNormalized = {
    x: gridX ? 1 / gridX : 0,
    y: gridY ? 1 / gridY : 0,
  };
  const tokenSizePercent = gridSizeNormalized.x;

  const [selectedToolId, setSelectedToolId] = useState("pan");
  const [toolSettings, setToolSettings] = useState({
    fog: { type: "polygon", useEdgeSnapping: false, useFogCut: false },
    drawing: {
      color: "red",
      type: "brush",
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
        if (action.type === "subtract") {
          const actionGeom = action.shapes.map((actionShape) => [
            actionShape.data.points.map(({ x, y }) => [x, y]),
          ]);
          let subtractedShapes = {};
          for (let shape of Object.values(shapesById)) {
            const shapePoints = shape.data.points.map(({ x, y }) => [x, y]);
            const shapeHoles = shape.data.holes.map((hole) =>
              hole.map(({ x, y }) => [x, y])
            );
            let shapeGeom = [[shapePoints, ...shapeHoles]];
            const difference = polygonClipping.difference(
              shapeGeom,
              actionGeom
            );
            for (let i = 0; i < difference.length; i++) {
              let newId = difference.length > 1 ? `${shape.id}-${i}` : shape.id;
              // Holes detected
              let holes = [];
              if (difference[i].length > 1) {
                for (let j = 1; j < difference[i].length; j++) {
                  holes.push(difference[i][j].map(([x, y]) => ({ x, y })));
                }
              }

              subtractedShapes[newId] = {
                ...shape,
                id: newId,
                data: {
                  points: difference[i][0].map(([x, y]) => ({ x, y })),
                  holes,
                },
              };
            }
          }
          shapesById = subtractedShapes;
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

  const disabledControls = [];
  if (!allowMapDrawing) {
    disabledControls.push("drawing");
  }
  if (!map) {
    disabledControls.push("pan");
  }
  if (!allowFogDrawing) {
    disabledControls.push("fog");
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
      toolSettings={toolSettings}
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

  // Sort so vehicles render below other tokens
  function sortMapTokenStates(a, b) {
    const tokenA = tokensById[a.tokenId];
    const tokenB = tokensById[b.tokenId];
    if (tokenA && tokenB) {
      return tokenB.isVehicle - tokenA.isVehicle;
    } else if (tokenA) {
      return 1;
    } else if (tokenB) {
      return -1;
    } else {
      return 0;
    }
  }

  const mapTokens =
    mapState &&
    Object.values(mapState.tokens)
      .sort(sortMapTokenStates)
      .map((tokenState) => (
        <MapToken
          key={tokenState.id}
          token={tokensById[tokenState.tokenId]}
          tokenState={tokenState}
          tokenSizePercent={tokenSizePercent}
          onTokenStateChange={onMapTokenStateChange}
          onTokenMenuOpen={handleTokenMenuOpen}
          onTokenDragStart={(e) =>
            setDraggingTokenOptions({ tokenState, tokenImage: e.target })
          }
          onTokenDragEnd={() => setDraggingTokenOptions(null)}
          draggable={
            (selectedToolId === "pan" || selectedToolId === "erase") &&
            !(tokenState.id in disabledTokens)
          }
          mapState={mapState}
        />
      ));

  const tokenMenu = (
    <TokenMenu
      isOpen={isTokenMenuOpen}
      onRequestClose={() => setIsTokenMenuOpen(false)}
      onTokenStateChange={onMapTokenStateChange}
      tokenState={mapState && mapState.tokens[tokenMenuOptions.tokenStateId]}
      tokenImage={tokenMenuOptions.tokenImage}
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
      tokenImage={draggingTokenOptions && draggingTokenOptions.tokenImage}
      token={tokensById[draggingTokenOptions.tokenState.tokenId]}
      mapState={mapState}
    />
  );

  const mapDrawing = (
    <MapDrawing
      shapes={mapShapes}
      onShapeAdd={handleMapShapeAdd}
      onShapesRemove={handleMapShapesRemove}
      selectedToolId={selectedToolId}
      selectedToolSettings={toolSettings[selectedToolId]}
      gridSize={gridSizeNormalized}
    />
  );

  const mapFog = (
    <MapFog
      shapes={fogShapes}
      onShapeAdd={handleFogShapeAdd}
      onShapeSubtract={handleFogShapeSubtract}
      onShapesRemove={handleFogShapesRemove}
      onShapesEdit={handleFogShapesEdit}
      selectedToolId={selectedToolId}
      selectedToolSettings={toolSettings[selectedToolId]}
      gridSize={gridSizeNormalized}
    />
  );

  const mapGrid = map && map.showGrid && (
    <MapGrid map={map} gridSize={gridSizeNormalized} />
  );

  return (
    <MapInteraction
      map={map}
      controls={
        <>
          {mapControls}
          {tokenMenu}
          {tokenDragOverlay}
          <MapDice />
          {isLoading && <LoadingOverlay />}
        </>
      }
      selectedToolId={selectedToolId}
      onSelectedToolChange={setSelectedToolId}
    >
      {mapGrid}
      {mapDrawing}
      {mapTokens}
      {mapFog}
    </MapInteraction>
  );
}

export default Map;

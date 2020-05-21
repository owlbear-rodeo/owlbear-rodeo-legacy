import React, { useState, useContext } from "react";

import MapControls from "./MapControls";

import MapInteraction from "./MapInteraction";
import MapToken from "./MapToken";

import TokenDataContext from "../../contexts/TokenDataContext";
import TokenMenu from "../token/TokenMenu";

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
      />
    ));

  const tokenMenu = isTokenMenuOpen && (
    <TokenMenu
      isOpen={isTokenMenuOpen}
      onRequestClose={() => setIsTokenMenuOpen(false)}
      onTokenChange={onMapTokenStateChange}
      tokenState={mapState.tokens[tokenMenuOptions.tokenStateId]}
      tokenImage={tokenMenuOptions.tokenImage}
    />
  );

  return (
    <MapInteraction
      map={map}
      controls={
        <>
          {mapControls}
          {tokenMenu}
        </>
      }
    >
      {mapTokens}
    </MapInteraction>
  );
}

export default Map;

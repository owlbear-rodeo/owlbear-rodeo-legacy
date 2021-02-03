import React, { useState, useContext } from "react";
import { Group } from "react-konva";

import MapControls from "./MapControls";
import MapInteraction from "./MapInteraction";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";
import MapFog from "./MapFog";
import MapGrid from "./MapGrid";
import MapMeasure from "./MapMeasure";
import NetworkedMapPointer from "../../network/NetworkedMapPointer";
import MapNotes from "./MapNotes";

import TokenDataContext from "../../contexts/TokenDataContext";
import SettingsContext from "../../contexts/SettingsContext";

import TokenMenu from "../token/TokenMenu";
import TokenDragOverlay from "../token/TokenDragOverlay";
import NoteMenu from "../note/NoteMenu";
import NoteDragOverlay from "../note/NoteDragOverlay";

import {
  AddShapeAction,
  CutShapeAction,
  EditShapeAction,
  RemoveShapeAction,
} from "../../actions";

function Map({
  map,
  mapState,
  mapActions,
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
  onMapNoteChange,
  onMapNoteRemove,
  allowMapDrawing,
  allowFogDrawing,
  allowMapChange,
  allowNoteEditing,
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

  const drawShapes = Object.values(mapState?.drawShapes || {});
  const fogShapes = Object.values(mapState?.fogShapes || {});

  function handleToolAction(action) {
    if (action === "eraseAll") {
      onMapDraw(new RemoveShapeAction(drawShapes.map((s) => s.id)));
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

  function handleMapShapeAdd(shape) {
    onMapDraw(new AddShapeAction([shape]));
  }

  function handleMapShapesRemove(shapeIds) {
    onMapDraw(new RemoveShapeAction(shapeIds));
  }

  function handleFogShapeAdd(shape) {
    onFogDraw(new AddShapeAction([shape]));
  }

  function handleFogShapeCut(shape) {
    onFogDraw(new CutShapeAction([shape]));
  }

  function handleFogShapesRemove(shapeIds) {
    onFogDraw(new RemoveShapeAction(shapeIds));
  }

  function handleFogShapesEdit(shapes) {
    onFogDraw(new EditShapeAction(shapes));
  }

  const disabledControls = [];
  if (!allowMapDrawing) {
    disabledControls.push("drawing");
  }
  if (!map) {
    disabledControls.push("pan");
    disabledControls.push("measure");
    disabledControls.push("pointer");
  }
  if (!allowFogDrawing) {
    disabledControls.push("fog");
  }
  if (!allowMapChange) {
    disabledControls.push("map");
  }
  if (!allowNoteEditing) {
    disabledControls.push("note");
  }

  const disabledSettings = { fog: [], drawing: [] };
  if (drawShapes.length === 0) {
    disabledSettings.drawing.push("erase");
  }
  if (!mapState || mapActions.mapDrawActionIndex < 0) {
    disabledSettings.drawing.push("undo");
  }
  if (
    !mapState ||
    mapActions.mapDrawActionIndex === mapActions.mapDrawActions.length - 1
  ) {
    disabledSettings.drawing.push("redo");
  }
  if (!mapState || mapActions.fogDrawActionIndex < 0) {
    disabledSettings.fog.push("undo");
  }
  if (
    !mapState ||
    mapActions.fogDrawActionIndex === mapActions.fogDrawActions.length - 1
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
  const [tokenDraggingOptions, setTokenDraggingOptions] = useState();
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
  function sortMapTokenStates(a, b, tokenDraggingOptions) {
    const tokenA = tokensById[a.tokenId];
    const tokenB = tokensById[b.tokenId];
    if (tokenA && tokenB) {
      // If categories are different sort in order "prop", "vehicle", "character"
      if (tokenB.category !== tokenA.category) {
        const aWeight = getMapTokenCategoryWeight(tokenA.category);
        const bWeight = getMapTokenCategoryWeight(tokenB.category);
        return bWeight - aWeight;
      } else if (
        tokenDraggingOptions &&
        tokenDraggingOptions.dragging &&
        tokenDraggingOptions.tokenState.id === a.id
      ) {
        // If dragging token a move above
        return 1;
      } else if (
        tokenDraggingOptions &&
        tokenDraggingOptions.dragging &&
        tokenDraggingOptions.tokenState.id === b.id
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
        .sort((a, b) => sortMapTokenStates(a, b, tokenDraggingOptions))
        .map((tokenState) => (
          <MapToken
            key={tokenState.id}
            token={tokensById[tokenState.tokenId]}
            tokenState={tokenState}
            tokenSizePercent={tokenSizePercent}
            onTokenStateChange={onMapTokenStateChange}
            onTokenMenuOpen={handleTokenMenuOpen}
            onTokenDragStart={(e) =>
              setTokenDraggingOptions({
                dragging: true,
                tokenState,
                tokenGroup: e.target,
              })
            }
            onTokenDragEnd={() =>
              setTokenDraggingOptions({
                ...tokenDraggingOptions,
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

  const tokenDragOverlay = tokenDraggingOptions && (
    <TokenDragOverlay
      onTokenStateRemove={(state) => {
        onMapTokenStateRemove(state);
        setTokenDraggingOptions(null);
      }}
      onTokenStateChange={onMapTokenStateChange}
      tokenState={tokenDraggingOptions && tokenDraggingOptions.tokenState}
      tokenGroup={tokenDraggingOptions && tokenDraggingOptions.tokenGroup}
      dragging={!!(tokenDraggingOptions && tokenDraggingOptions.dragging)}
      token={tokensById[tokenDraggingOptions.tokenState.tokenId]}
      mapState={mapState}
    />
  );

  const mapDrawing = (
    <MapDrawing
      map={map}
      shapes={drawShapes}
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
      onShapeCut={handleFogShapeCut}
      onShapesRemove={handleFogShapesRemove}
      onShapesEdit={handleFogShapesEdit}
      active={selectedToolId === "fog"}
      toolSettings={settings.fog}
      gridSize={gridSizeNormalized}
      editable={allowFogDrawing && !settings.fog.preview}
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

  const [isNoteMenuOpen, setIsNoteMenuOpen] = useState(false);
  const [noteMenuOptions, setNoteMenuOptions] = useState({});
  const [noteDraggingOptions, setNoteDraggingOptions] = useState();
  function handleNoteMenuOpen(noteId, noteNode) {
    setNoteMenuOptions({ noteId, noteNode });
    setIsNoteMenuOpen(true);
  }

  function sortNotes(a, b, noteDraggingOptions) {
    if (
      noteDraggingOptions &&
      noteDraggingOptions.dragging &&
      noteDraggingOptions.noteId === a.id
    ) {
      // If dragging token `a` move above
      return 1;
    } else if (
      noteDraggingOptions &&
      noteDraggingOptions.dragging &&
      noteDraggingOptions.noteId === b.id
    ) {
      // If dragging token `b` move above
      return -1;
    } else {
      // Else sort so last modified is on top
      return a.lastModified - b.lastModified;
    }
  }

  const mapNotes = (
    <MapNotes
      map={map}
      active={selectedToolId === "note"}
      gridSize={gridSizeNormalized}
      selectedToolSettings={settings[selectedToolId]}
      onNoteAdd={onMapNoteChange}
      onNoteChange={onMapNoteChange}
      notes={
        mapState
          ? Object.values(mapState.notes).sort((a, b) =>
              sortNotes(a, b, noteDraggingOptions)
            )
          : []
      }
      onNoteMenuOpen={handleNoteMenuOpen}
      draggable={
        allowNoteEditing &&
        (selectedToolId === "note" || selectedToolId === "pan")
      }
      onNoteDragStart={(e, noteId) =>
        setNoteDraggingOptions({ dragging: true, noteId, noteGroup: e.target })
      }
      onNoteDragEnd={() =>
        setNoteDraggingOptions({ ...noteDraggingOptions, dragging: false })
      }
      fadeOnHover={selectedToolId === "drawing"}
    />
  );

  const noteMenu = (
    <NoteMenu
      isOpen={isNoteMenuOpen}
      onRequestClose={() => setIsNoteMenuOpen(false)}
      onNoteChange={onMapNoteChange}
      note={mapState && mapState.notes[noteMenuOptions.noteId]}
      noteNode={noteMenuOptions.noteNode}
      map={map}
    />
  );

  const noteDragOverlay = (
    <NoteDragOverlay
      dragging={!!(noteDraggingOptions && noteDraggingOptions.dragging)}
      noteGroup={noteDraggingOptions && noteDraggingOptions.noteGroup}
      noteId={noteDraggingOptions && noteDraggingOptions.noteId}
      onNoteRemove={(noteId) => {
        onMapNoteRemove(noteId);
        setNoteDraggingOptions(null);
      }}
    />
  );

  return (
    <MapInteraction
      map={map}
      mapState={mapState}
      controls={
        <>
          {mapControls}
          {tokenMenu}
          {noteMenu}
          {tokenDragOverlay}
          {noteDragOverlay}
        </>
      }
      selectedToolId={selectedToolId}
      onSelectedToolChange={setSelectedToolId}
      disabledControls={disabledControls}
    >
      {mapGrid}
      {mapDrawing}
      {mapNotes}
      {mapTokens}
      {mapFog}
      {mapPointer}
      {mapMeasure}
    </MapInteraction>
  );
}

export default Map;

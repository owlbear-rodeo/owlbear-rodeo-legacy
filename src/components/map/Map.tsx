import { useState } from "react";
import { Box } from "theme-ui";
import { useToasts } from "react-toast-notifications";

import MapControls from "./MapControls";
import MapInteraction from "./MapInteraction";
import MapTokens from "./MapTokens";
import MapDrawing from "./MapDrawing";
import MapFog from "./MapFog";
import MapGrid from "./MapGrid";
import MapMeasure from "./MapMeasure";
import NetworkedMapPointer from "../../network/NetworkedMapPointer";
import MapNotes from "./MapNotes";

import { useSettings } from "../../contexts/SettingsContext";

import TokenMenu from "../token/TokenMenu";
import TokenDragOverlay from "../token/TokenDragOverlay";
import NoteMenu from "../note/NoteMenu";
import NoteDragOverlay from "../note/NoteDragOverlay";

import {
  AddStatesAction,
  CutFogAction,
  EditStatesAction,
  RemoveStatesAction,
} from "../../actions";
import Session from "../../network/Session";
import { Drawing, DrawingState } from "../../types/Drawing";
import { Fog, FogState } from "../../types/Fog";
import { Map as MapType, MapActions, MapToolId } from "../../types/Map";
import { MapState } from "../../types/MapState";
import { Settings } from "../../types/Settings";
import {
  MapChangeEventHandler,
  MapResetEventHandler,
  MapTokenStateRemoveHandler,
  NoteChangeEventHandler,
  NoteRemoveEventHander,
  TokenStateChangeEventHandler,
} from "../../types/Events";
import Action from "../../actions/Action";
import Konva from "konva";
import { TokenDraggingOptions, TokenMenuOptions } from "../../types/Token";
import { Note, NoteDraggingOptions, NoteMenuOptions } from "../../types/Note";

type MapProps = {
  map: MapType | null;
  mapState: MapState | null;
  mapActions: MapActions;
  onMapTokenStateChange: TokenStateChangeEventHandler;
  onMapTokenStateRemove: MapTokenStateRemoveHandler;
  onMapChange: MapChangeEventHandler;
  onMapReset: MapResetEventHandler;
  onMapDraw: (action: Action<DrawingState>) => void;
  onMapDrawUndo: () => void;
  onMapDrawRedo: () => void;
  onFogDraw: (action: Action<FogState>) => void;
  onFogDrawUndo: () => void;
  onFogDrawRedo: () => void;
  onMapNoteChange: NoteChangeEventHandler;
  onMapNoteRemove: NoteRemoveEventHander;
  allowMapDrawing: boolean;
  allowFogDrawing: boolean;
  allowMapChange: boolean;
  allowNoteEditing: boolean;
  disabledTokens: Record<string, boolean>;
  session: Session;
};

function Map({
  map,
  mapState,
  mapActions,
  onMapTokenStateChange,
  onMapTokenStateRemove,
  onMapChange,
  onMapReset,
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
}: MapProps) {
  const { addToast } = useToasts();

  const [selectedToolId, setSelectedToolId] = useState<MapToolId>("move");
  const { settings, setSettings } = useSettings();

  function handleToolSettingChange(change: Partial<Settings>) {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...change,
    }));
  }

  const drawShapes = Object.values(mapState?.drawShapes || {});
  const fogShapes = Object.values(mapState?.fogShapes || {});

  function handleToolAction(action: string) {
    if (action === "eraseAll") {
      onMapDraw(new RemoveStatesAction(drawShapes.map((s) => s.id)));
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

  function handleMapShapeAdd(shape: Drawing) {
    onMapDraw(new AddStatesAction([shape]));
  }

  function handleMapShapesRemove(shapeIds: string[]) {
    onMapDraw(new RemoveStatesAction(shapeIds));
  }

  function handleFogShapesAdd(shapes: Fog[]) {
    onFogDraw(new AddStatesAction(shapes));
  }

  function handleFogShapesCut(shapes: Fog[]) {
    onFogDraw(new CutFogAction(shapes));
  }

  function handleFogShapesRemove(shapeIds: string[]) {
    onFogDraw(new RemoveStatesAction(shapeIds));
  }

  function handleFogShapesEdit(shapes: Partial<Fog>[]) {
    onFogDraw(new EditStatesAction(shapes));
  }

  const disabledControls: MapToolId[] = [];
  if (!allowMapDrawing) {
    disabledControls.push("drawing");
  }
  if (!map) {
    disabledControls.push("move");
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

  const disabledSettings: {
    fog: string[];
    drawing: string[];
  } = {
    fog: [],
    drawing: [],
  };
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
      onMapReset={onMapReset}
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

  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState<boolean>(false);
  const [tokenMenuOptions, setTokenMenuOptions] = useState<TokenMenuOptions>();
  const [tokenDraggingOptions, setTokenDraggingOptions] =
    useState<TokenDraggingOptions>();
  function handleTokenMenuOpen(tokenStateId: string, tokenImage: Konva.Node) {
    setTokenMenuOptions({ tokenStateId, tokenImage });
    setIsTokenMenuOpen(true);
  }

  const mapTokens = map && mapState && (
    <MapTokens
      map={map}
      mapState={mapState}
      tokenDraggingOptions={tokenDraggingOptions}
      setTokenDraggingOptions={setTokenDraggingOptions}
      onMapTokenStateChange={onMapTokenStateChange}
      onTokenMenuOpen={handleTokenMenuOpen}
      selectedToolId={selectedToolId}
      disabledTokens={disabledTokens}
    />
  );

  const tokenMenu = (
    <TokenMenu
      isOpen={isTokenMenuOpen}
      onRequestClose={() => setIsTokenMenuOpen(false)}
      onTokenStateChange={onMapTokenStateChange}
      tokenState={
        tokenMenuOptions && mapState?.tokens[tokenMenuOptions.tokenStateId]
      }
      tokenImage={tokenMenuOptions && tokenMenuOptions.tokenImage}
      map={map}
    />
  );

  const tokenDragOverlay = tokenDraggingOptions && (
    <TokenDragOverlay
      onTokenStateRemove={(state) => {
        onMapTokenStateRemove(state);
        setTokenDraggingOptions(undefined);
      }}
      tokenState={tokenDraggingOptions && tokenDraggingOptions.tokenState}
      tokenNode={tokenDraggingOptions && tokenDraggingOptions.tokenNode}
      dragging={!!(tokenDraggingOptions && tokenDraggingOptions.dragging)}
    />
  );

  const mapDrawing = (
    <MapDrawing
      map={map}
      drawings={drawShapes}
      onDrawingAdd={handleMapShapeAdd}
      onDrawingsRemove={handleMapShapesRemove}
      active={selectedToolId === "drawing"}
      toolSettings={settings.drawing}
    />
  );

  const mapFog = (
    <MapFog
      map={map}
      shapes={fogShapes}
      onShapesAdd={handleFogShapesAdd}
      onShapesCut={handleFogShapesCut}
      onShapesRemove={handleFogShapesRemove}
      onShapesEdit={handleFogShapesEdit}
      onShapeError={addToast}
      active={selectedToolId === "fog"}
      toolSettings={settings.fog}
      editable={allowFogDrawing && !settings.fog.preview}
    />
  );

  const mapGrid = map && map.showGrid && <MapGrid map={map} />;

  const mapMeasure = (
    <MapMeasure map={map} active={selectedToolId === "measure"} />
  );

  const mapPointer = (
    <NetworkedMapPointer
      active={selectedToolId === "pointer"}
      session={session}
    />
  );

  const [isNoteMenuOpen, setIsNoteMenuOpen] = useState<boolean>(false);
  const [noteMenuOptions, setNoteMenuOptions] = useState<NoteMenuOptions>();
  const [noteDraggingOptions, setNoteDraggingOptions] =
    useState<NoteDraggingOptions>();
  function handleNoteMenuOpen(noteId: string, noteNode: Konva.Node) {
    setNoteMenuOptions({ noteId, noteNode });
    setIsNoteMenuOpen(true);
  }

  function sortNotes(
    a: Note,
    b: Note,
    noteDraggingOptions?: NoteDraggingOptions
  ) {
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
        (selectedToolId === "note" || selectedToolId === "move")
      }
      onNoteDragStart={(e, noteId) =>
        setNoteDraggingOptions({ dragging: true, noteId, noteGroup: e.target })
      }
      onNoteDragEnd={() =>
        noteDraggingOptions &&
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
      note={noteMenuOptions && mapState?.notes[noteMenuOptions.noteId]}
      noteNode={noteMenuOptions?.noteNode}
      map={map}
    />
  );

  const noteDragOverlay = noteDraggingOptions ? (
    <NoteDragOverlay
      dragging={noteDraggingOptions.dragging}
      noteGroup={noteDraggingOptions.noteGroup}
      noteId={noteDraggingOptions.noteId}
      onNoteRemove={(noteId) => {
        onMapNoteRemove(noteId);
        setNoteDraggingOptions(undefined);
      }}
    />
  ) : null;

  return (
    <Box sx={{ flexGrow: 1 }}>
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
    </Box>
  );
}

export default Map;

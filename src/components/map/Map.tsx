import React, { useState } from "react";

import MapControls from "./MapControls";
import MapInteraction from "./MapInteraction";
import MapTokens from "./MapTokens";
import MapDrawing from "./MapDrawing";
import MapFog from "./MapFog";
import MapGrid from "./MapGrid";
import MapMeasure from "./MapMeasure";
import NetworkedMapPointer from "../../network/NetworkedMapPointer";
import MapNotes from "./MapNotes";

import { useTokenData } from "../../contexts/TokenDataContext";
import { useSettings } from "../../contexts/SettingsContext";

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
import { Fog, Path, Shape } from "../../helpers/drawing";
import Session from "../../network/Session";
import { Grid } from "../../helpers/grid";
import { ImageFile } from "../../helpers/image";

type Resolutions = Record<string, ImageFile>

export type Map = {
  id: string,
  name: string,
  owner: string,
  file: Uint8Array,
  quality: string,
  resolutions: Resolutions,
  grid: Grid,
  group: string,
  width: number,
  height: number,
  type: string,
  lastUsed: number,
  lastModified: number,
  created: number,
  showGrid: boolean,
  snapToGrid: boolean,
  thumbnail: ImageFile,
}

export type Note = {
  id: string,
  color: string,
  lastModified: number,
  lastModifiedBy: string,
  locked: boolean,
  size: number,
  text: string,
  textOnly: boolean,
  visible: boolean,
  x: number,
  y: number,
}

export type TokenState = {
  id: string,
  tokenId: string,
  owner: string,
  size: number,
  label: string,
  status: string[],
  x: number,
  y: number,
  lastModifiedBy: string,
  lastModified: number,
  rotation: number,
  locked: boolean,
  visible: boolean
}

interface PathId extends Path {
  id: string
}

interface ShapeId extends Shape {
  id: string
}
export type MapState = {
  tokens: Record<string, TokenState>,
  drawShapes: PathId | ShapeId, 
  fogShapes: Fog[],
  editFlags: string[], 
  notes: Note[], 
  mapId: string,
}

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
}: {
  map: any
  mapState: MapState
  mapActions: any,
  onMapTokenStateChange: any,
  onMapTokenStateRemove: any,
  onMapChange: any, 
  onMapReset: any,
  onMapDraw: any,
  onMapDrawUndo: any,
  onMapDrawRedo: any,
  onFogDraw: any,
  onFogDrawUndo: any,
  onFogDrawRedo: any,
  onMapNoteChange: any,
  onMapNoteRemove: any,
  allowMapDrawing: boolean,
  allowFogDrawing: boolean,
  allowMapChange: boolean,
  allowNoteEditing: boolean,
  disabledTokens: any,
  session: Session
}) {
  const { tokensById } = useTokenData();

  const [selectedToolId, setSelectedToolId] = useState("move");
  const { settings, setSettings }: { settings: any, setSettings: any} = useSettings();

  function handleToolSettingChange(tool: any, change: any) {
    setSettings((prevSettings: any) => ({
      ...prevSettings,
      [tool]: {
        ...prevSettings[tool],
        ...change,
      },
    }));
  }

  const drawShapes = Object.values(mapState?.drawShapes || {});
  const fogShapes = Object.values(mapState?.fogShapes || {});

  function handleToolAction(action: string) {
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

  function handleMapShapeAdd(shape: Shape) {
    onMapDraw(new AddShapeAction([shape]));
  }

  function handleMapShapesRemove(shapeIds: string[]) {
    onMapDraw(new RemoveShapeAction(shapeIds));
  }

  function handleFogShapesAdd(shapes: Shape[]) {
    onFogDraw(new AddShapeAction(shapes));
  }

  function handleFogShapesCut(shapes: Shape[]) {
    onFogDraw(new CutShapeAction(shapes));
  }

  function handleFogShapesRemove(shapeIds: string[]) {
    onFogDraw(new RemoveShapeAction(shapeIds));
  }

  function handleFogShapesEdit(shapes: Shape[]) {
    onFogDraw(new EditShapeAction(shapes));
  }

  const disabledControls = [];
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

  const disabledSettings: { fog: any[], drawing: any[]} = { fog: [], drawing: [] };
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

  const [isTokenMenuOpen, setIsTokenMenuOpen]: [ isTokenMenuOpen: boolean, setIsTokenMenuOpen: React.Dispatch<React.SetStateAction<boolean>>] = useState<boolean>(false);
  const [tokenMenuOptions, setTokenMenuOptions]: [ tokenMenuOptions: any, setTokenMenuOptions: any ] = useState({});
  const [tokenDraggingOptions, setTokenDraggingOptions]: [ tokenDraggingOptions: any, setTokenDragginOptions: any ] = useState();
  function handleTokenMenuOpen(tokenStateId: string, tokenImage: any) {
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
      handleTokenMenuOpen={handleTokenMenuOpen}
      selectedToolId={selectedToolId}
      disabledTokens={disabledTokens}
    />
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
      onTokenStateRemove={(state: any) => {
        onMapTokenStateRemove(state);
        setTokenDraggingOptions(null);
      }}
      onTokenStateChange={onMapTokenStateChange}
      tokenState={tokenDraggingOptions && tokenDraggingOptions.tokenState}
      tokenGroup={tokenDraggingOptions && tokenDraggingOptions.tokenGroup}
      dragging={!!(tokenDraggingOptions && tokenDraggingOptions.dragging)}
      token={tokensById[tokenDraggingOptions.tokenState.tokenId]}
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
      active={selectedToolId === "fog"}
      toolSettings={settings.fog}
      editable={allowFogDrawing && !settings.fog.preview}
    />
  );

  const mapGrid = map && map.showGrid && <MapGrid map={map} />;

  const mapMeasure = (
    <MapMeasure
      map={map}
      active={selectedToolId === "measure"}
    />
  );

  const mapPointer = (
    <NetworkedMapPointer
      active={selectedToolId === "pointer"}
      session={session}
    />
  );

  const [isNoteMenuOpen, setIsNoteMenuOpen] = useState<boolean>(false);
  const [noteMenuOptions, setNoteMenuOptions] = useState<any>({});
  const [noteDraggingOptions, setNoteDraggingOptions]= useState<any>();
  function handleNoteMenuOpen(noteId: string, noteNode: any) {
    setNoteMenuOptions({ noteId, noteNode });
    setIsNoteMenuOpen(true);
  }

  function sortNotes(a: any, b: any, noteDraggingOptions: any) {
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
      onNoteDragStart={(e: any, noteId: any) =>
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
      onNoteRemove={(noteId: any) => {
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

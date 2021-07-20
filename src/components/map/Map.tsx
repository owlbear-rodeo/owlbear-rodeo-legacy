import { useState } from "react";
import { Box } from "theme-ui";
import { useToasts } from "react-toast-notifications";

import MapControls from "./MapControls";
import MapInteraction from "./MapInteraction";
import MapGrid from "./MapGrid";

import DrawingTool from "../tools/DrawingTool";
import FogTool from "../tools/FogTool";
import MeasureTool from "../tools/MeasureTool";
import NetworkedMapPointer from "../../network/NetworkedMapPointer";
import SelectTool from "../tools/SelectTool";

import { useSettings } from "../../contexts/SettingsContext";

import Action from "../../actions/Action";
import {
  AddStatesAction,
  CutFogAction,
  EditStatesAction,
  RemoveStatesAction,
} from "../../actions";

import Session from "../../network/Session";

import { Drawing, DrawingState } from "../../types/Drawing";
import { Fog, FogState } from "../../types/Fog";
import { Map as MapType, MapToolId } from "../../types/Map";
import { MapState } from "../../types/MapState";
import { Settings } from "../../types/Settings";
import {
  MapChangeEventHandler,
  MapResetEventHandler,
  TokenStateRemoveHandler,
  NoteChangeEventHandler,
  NoteRemoveEventHander,
  TokenStateChangeEventHandler,
  NoteCreateEventHander,
} from "../../types/Events";

import useMapTokens from "../../hooks/useMapTokens";
import useMapNotes from "../../hooks/useMapNotes";

type MapProps = {
  map: MapType | null;
  mapState: MapState | null;
  onMapTokenStateChange: TokenStateChangeEventHandler;
  onMapTokenStateRemove: TokenStateRemoveHandler;
  onMapChange: MapChangeEventHandler;
  onMapReset: MapResetEventHandler;
  onMapDraw: (action: Action<DrawingState>) => void;
  onFogDraw: (action: Action<FogState>) => void;
  onMapNoteCreate: NoteCreateEventHander;
  onMapNoteChange: NoteChangeEventHandler;
  onMapNoteRemove: NoteRemoveEventHander;
  allowMapDrawing: boolean;
  allowFogDrawing: boolean;
  allowMapChange: boolean;
  allowNoteEditing: boolean;
  disabledTokens: Record<string, boolean>;
  session: Session;
  onUndo: () => void;
  onRedo: () => void;
};

function Map({
  map,
  mapState,
  onMapTokenStateChange,
  onMapTokenStateRemove,
  onMapChange,
  onMapReset,
  onMapDraw,
  onFogDraw,
  onMapNoteCreate,
  onMapNoteChange,
  onMapNoteRemove,
  allowMapDrawing,
  allowFogDrawing,
  allowMapChange,
  allowNoteEditing,
  disabledTokens,
  session,
  onUndo,
  onRedo,
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
    disabledControls.push("select");
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
    drawing: string[];
  } = {
    drawing: [],
  };
  if (drawShapes.length === 0) {
    disabledSettings.drawing.push("erase");
  }

  const { tokens, tokenMenu, tokenDragOverlay } = useMapTokens(
    map,
    mapState,
    onMapTokenStateChange,
    onMapTokenStateRemove,
    selectedToolId,
    disabledTokens
  );

  const { notes, noteMenu, noteDragOverlay } = useMapNotes(
    map,
    mapState,
    onMapNoteCreate,
    onMapNoteChange,
    onMapNoteRemove,
    selectedToolId,
    allowNoteEditing
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <MapInteraction
        map={map}
        mapState={mapState}
        controls={
          <>
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
              onUndo={onUndo}
              onRedo={onRedo}
            />
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
        {map && map.showGrid && <MapGrid map={map} />}
        <DrawingTool
          map={map}
          drawings={drawShapes}
          onDrawingAdd={handleMapShapeAdd}
          onDrawingsRemove={handleMapShapesRemove}
          active={selectedToolId === "drawing"}
          toolSettings={settings.drawing}
        />
        {notes}
        {tokens}
        <FogTool
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
        <NetworkedMapPointer
          active={selectedToolId === "pointer"}
          session={session}
        />
        <MeasureTool map={map} active={selectedToolId === "measure"} />
        <SelectTool
          active={selectedToolId === "select"}
          toolSettings={settings.select}
        />
      </MapInteraction>
    </Box>
  );
}

export default Map;

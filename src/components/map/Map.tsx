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
import { useUserId } from "../../contexts/UserIdContext";

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
  SelectionItemsChangeEventHandler,
} from "../../types/Events";

import useMapTokens from "../../hooks/useMapTokens";
import useMapNotes from "../../hooks/useMapNotes";
import { MapActions } from "../../hooks/useMapActions";

type MapProps = {
  map: MapType | null;
  mapState: MapState | null;
  mapActions: MapActions;
  onMapTokenStateChange: TokenStateChangeEventHandler;
  onMapTokenStateRemove: TokenStateRemoveHandler;
  onSelectionItemsChange: SelectionItemsChangeEventHandler;
  onMapChange: MapChangeEventHandler;
  onMapReset: MapResetEventHandler;
  onMapDraw: (action: Action<DrawingState>) => void;
  onFogDraw: (action: Action<FogState>) => void;
  onMapNoteCreate: NoteCreateEventHander;
  onMapNoteChange: NoteChangeEventHandler;
  onMapNoteRemove: NoteRemoveEventHander;
  allowMapChange: boolean;
  session: Session;
  onUndo: () => void;
  onRedo: () => void;
};

function Map({
  map,
  mapState,
  mapActions,
  onMapTokenStateChange,
  onMapTokenStateRemove,
  onSelectionItemsChange,
  onMapChange,
  onMapReset,
  onMapDraw,
  onFogDraw,
  onMapNoteCreate,
  onMapNoteChange,
  onMapNoteRemove,
  allowMapChange,
  session,
  onUndo,
  onRedo,
}: MapProps) {
  const { addToast } = useToasts();

  const userId = useUserId();

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

  const { tokens, tokenMenu, tokenDragOverlay } = useMapTokens(
    map,
    mapState,
    onMapTokenStateChange,
    onMapTokenStateRemove,
    selectedToolId
  );

  const { notes, noteMenu, noteDragOverlay } = useMapNotes(
    map,
    mapState,
    onMapNoteCreate,
    onMapNoteChange,
    onMapNoteRemove,
    selectedToolId,
    !!(map?.owner === userId || mapState?.editFlags.includes("notes"))
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
              map={map}
              mapState={mapState}
              mapActions={mapActions}
              allowMapChange={allowMapChange}
              onSelectedToolChange={setSelectedToolId}
              selectedToolId={selectedToolId}
              toolSettings={settings}
              onToolSettingChange={handleToolSettingChange}
              onToolAction={handleToolAction}
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
          editable={
            !!(map?.owner === userId || mapState?.editFlags.includes("fog")) &&
            !settings.fog.preview
          }
        />
        <NetworkedMapPointer
          active={selectedToolId === "pointer"}
          session={session}
        />
        <MeasureTool map={map} active={selectedToolId === "measure"} />
        <SelectTool
          active={selectedToolId === "select"}
          toolSettings={settings.select}
          onSelectionItemsChange={onSelectionItemsChange}
        />
      </MapInteraction>
    </Box>
  );
}

export default Map;

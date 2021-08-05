import { useEffect, useState } from "react";
import SelectionDragOverlay from "../components/selection/SelectionDragOverlay";
import SelectionMenu from "../components/selection/SelectionMenu";
import SelectTool from "../components/tools/SelectTool";
import { useUserId } from "../contexts/UserIdContext";
import {
  SelectionItemsChangeEventHandler,
  SelectionItemsCreateEventHandler,
  SelectionItemsRemoveEventHandler,
} from "../types/Events";
import { Map, MapToolId } from "../types/Map";
import { MapState } from "../types/MapState";
import { Selection } from "../types/Select";
import { SelectToolSettings } from "../types/Select";

function useMapSelection(
  map: Map | null,
  mapState: MapState | null,
  onSelectionItemsChange: SelectionItemsChangeEventHandler,
  onSelectionItemsRemove: SelectionItemsRemoveEventHandler,
  onSelectionItemsCreate: SelectionItemsCreateEventHandler,
  selectedToolId: MapToolId,
  settings: SelectToolSettings
) {
  const userId = useUserId();
  const disabledTokens: Record<string, boolean> = {};
  const disabledNotes: Record<string, boolean> = {};
  if (mapState && map && map.owner !== userId) {
    if (!mapState.editFlags.includes("tokens")) {
      for (let token of Object.values(mapState.tokens)) {
        if (token.owner !== userId) {
          disabledTokens[token.id] = true;
        }
      }
    }
    if (!mapState.editFlags.includes("notes")) {
      for (let note of Object.values(mapState.notes)) {
        disabledNotes[note.id] = true;
      }
    }
  }

  const [isSelectionMenuOpen, setIsSelectionMenuOpen] =
    useState<boolean>(false);
  const [isSelectionDragging, setIsSelectionDragging] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);

  function handleSelectionMenuOpen(open: boolean) {
    setIsSelectionMenuOpen(open);
  }

  const active = selectedToolId === "select";

  // Remove selection when changing tools
  useEffect(() => {
    if (!active) {
      setSelection(null);
      setIsSelectionMenuOpen(false);
    }
  }, [active]);

  // Remove selection when changing maps
  useEffect(() => {
    setSelection(null);
    setIsSelectionMenuOpen(false);
  }, [map]);

  function handleSelectionDragStart() {
    setIsSelectionDragging(true);
  }

  function handleSelectionDragEnd() {
    setIsSelectionDragging(false);
  }

  function handleSelectionItemsRemove(
    tokenStateIds: string[],
    noteIds: string[]
  ) {
    setSelection(null);
    onSelectionItemsRemove(tokenStateIds, noteIds);
  }

  const selectionTool = (
    <SelectTool
      active={active}
      toolSettings={settings}
      onSelectionItemsChange={onSelectionItemsChange}
      selection={selection}
      onSelectionChange={setSelection}
      onSelectionMenuOpen={handleSelectionMenuOpen}
      onSelectionDragStart={handleSelectionDragStart}
      onSelectionDragEnd={handleSelectionDragEnd}
      disabledTokens={disabledTokens}
      disabledNotes={disabledNotes}
    />
  );

  const selectionMenu = (
    <SelectionMenu
      isOpen={isSelectionMenuOpen}
      active={active}
      onRequestClose={() => setIsSelectionMenuOpen(false)}
      onRequestOpen={() => setIsSelectionMenuOpen(true)}
      selection={selection}
      onSelectionChange={setSelection}
      onSelectionItemsChange={onSelectionItemsChange}
      onSelectionItemsCreate={onSelectionItemsCreate}
      map={map}
      mapState={mapState}
    />
  );

  const selectionDragOverlay = selection ? (
    <SelectionDragOverlay
      dragging={isSelectionDragging}
      selection={selection}
      onSelectionItemsRemove={handleSelectionItemsRemove}
    />
  ) : null;

  return { selectionTool, selectionMenu, selectionDragOverlay };
}

export default useMapSelection;

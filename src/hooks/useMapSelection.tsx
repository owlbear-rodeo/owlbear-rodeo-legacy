import { useEffect, useState } from "react";
import SelectionMenu from "../components/selection/SelectionMenu";
import SelectTool from "../components/tools/SelectTool";
import { SelectionItemsChangeEventHandler } from "../types/Events";
import { Map, MapToolId } from "../types/Map";
import { MapState } from "../types/MapState";
import { Selection } from "../types/Select";
import { SelectToolSettings } from "../types/Select";

function useMapSelection(
  map: Map | null,
  mapState: MapState | null,
  onSelectionItemsChange: SelectionItemsChangeEventHandler,
  selectedToolId: MapToolId,
  settings: SelectToolSettings
) {
  const [isSelectionMenuOpen, setIsSelectionMenuOpen] =
    useState<boolean>(false);
  const [selection, setSelection] = useState<Selection | null>(null);

  function handleSelectionMenuOpen(open: boolean) {
    setIsSelectionMenuOpen(open);
  }

  const active = selectedToolId === "select";

  useEffect(() => {
    if (!active) {
      setSelection(null);
      setIsSelectionMenuOpen(false);
    }
  }, [active]);

  const selectionTool = (
    <SelectTool
      active={active}
      toolSettings={settings}
      onSelectionItemsChange={onSelectionItemsChange}
      selection={selection}
      onSelectionChange={setSelection}
      onSelectionMenuOpen={handleSelectionMenuOpen}
    />
  );

  const selectionMenu = (
    <SelectionMenu
      isOpen={isSelectionMenuOpen}
      onRequestClose={() => setIsSelectionMenuOpen(false)}
      selection={selection}
      onSelectionItemsChange={onSelectionItemsChange}
      map={map}
      mapState={mapState}
    />
  );

  return { selectionTool, selectionMenu };
}

export default useMapSelection;
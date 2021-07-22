import { useState } from "react";
import SelectionMenu from "../components/selection/SelectionMenu";
import SelectTool from "../components/tools/SelectTool";
import { SelectionItemsChangeEventHandler } from "../types/Events";
import { Map, MapToolId } from "../types/Map";
import { Selection } from "../types/Select";
import { SelectToolSettings } from "../types/Select";

function useMapSelection(
  map: Map | null,
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

  const selectionTool = (
    <SelectTool
      active={selectedToolId === "select"}
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
    />
  );

  return { selectionTool, selectionMenu };
}

export default useMapSelection;

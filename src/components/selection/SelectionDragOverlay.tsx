import { SelectionItemsRemoveEventHandler } from "../../types/Events";
import { Selection } from "../../types/Select";

import DragOverlay from "../map/DragOverlay";

type NoteDragOverlayProps = {
  onSelectionItemsRemove: SelectionItemsRemoveEventHandler;
  selection: Selection;
  dragging: boolean;
};

function NoteDragOverlay({
  onSelectionItemsRemove,
  selection,
  dragging,
}: NoteDragOverlayProps) {
  function handleNoteRemove() {
    const tokenIds: string[] = [];
    const noteIds: string[] = [];
    for (let item of selection.items) {
      if (item.type === "token") {
        tokenIds.push(item.id);
      } else {
        noteIds.push(item.id);
      }
    }
    onSelectionItemsRemove(tokenIds, noteIds);
  }

  return <DragOverlay dragging={dragging} onRemove={handleNoteRemove} />;
}

export default NoteDragOverlay;

import { NoteRemoveEventHander } from "../../types/Events";
import { NoteDraggingOptions } from "../../types/Note";

import DragOverlay from "../map/DragOverlay";

type NoteDragOverlayProps = {
  onNoteRemove: NoteRemoveEventHander;
  draggingOptions: NoteDraggingOptions;
};

function NoteDragOverlay({
  onNoteRemove,
  draggingOptions,
}: NoteDragOverlayProps) {
  function handleNoteRemove() {
    onNoteRemove([draggingOptions.noteId]);
  }

  return (
    <DragOverlay
      dragging={draggingOptions.dragging}
      onRemove={handleNoteRemove}
    />
  );
}

export default NoteDragOverlay;

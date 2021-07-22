import { NoteRemoveEventHander } from "../../types/Events";

import DragOverlay from "../map/DragOverlay";

type NoteDragOverlayProps = {
  onNoteRemove: NoteRemoveEventHander;
  noteId: string;
  dragging: boolean;
};

function NoteDragOverlay({
  onNoteRemove,
  noteId,
  dragging,
}: NoteDragOverlayProps) {
  function handleNoteRemove() {
    onNoteRemove([noteId]);
  }

  return <DragOverlay dragging={dragging} onRemove={handleNoteRemove} />;
}

export default NoteDragOverlay;

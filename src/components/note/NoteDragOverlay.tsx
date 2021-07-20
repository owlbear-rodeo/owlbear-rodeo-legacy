import Konva from "konva";
import { NoteRemoveEventHander } from "../../types/Events";

import DragOverlay from "../map/DragOverlay";

type NoteDragOverlayProps = {
  onNoteRemove: NoteRemoveEventHander;
  noteId: string;
  noteGroup: Konva.Node;
  dragging: boolean;
};

function NoteDragOverlay({
  onNoteRemove,
  noteId,
  noteGroup,
  dragging,
}: NoteDragOverlayProps) {
  function handleNoteRemove() {
    onNoteRemove([noteId]);
  }

  return (
    <DragOverlay
      dragging={dragging}
      onRemove={handleNoteRemove}
      node={noteGroup}
    />
  );
}

export default NoteDragOverlay;

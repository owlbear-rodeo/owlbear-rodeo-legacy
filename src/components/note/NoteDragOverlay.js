import React from "react";

import DragOverlay from "../map/DragOverlay";

function NoteDragOverlay({ onNoteRemove, noteId, noteGroup, dragging }) {
  function handleNoteRemove() {
    onNoteRemove(noteId);
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

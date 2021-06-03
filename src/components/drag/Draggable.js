import React from "react";
import { useDraggable } from "@dnd-kit/core";

function Draggable({ id, children, data }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
  });

  const style = {
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

export default Draggable;

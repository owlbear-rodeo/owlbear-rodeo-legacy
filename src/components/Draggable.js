import React from "react";
import { useDraggable } from "@dnd-kit/core";

function Draggable({ id, children, data }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
  });

  const style = {
    border: "none",
    background: "transparent",
    margin: "0px",
    padding: "0px",
    cursor: "pointer",
    touchAction: "none",
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </button>
  );
}

export default Draggable;

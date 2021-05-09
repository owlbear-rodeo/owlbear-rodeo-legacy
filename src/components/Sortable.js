import React from "react";
import { useSortable } from "@dnd-kit/sortable";

function Sortable({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    cursor: "pointer",
    touchAction: "none",
    opacity: isDragging ? 0.5 : undefined,
    transform:
      transform && `translate3d(${transform.x}px, ${transform.y}px, 0px)`,
    zIndex: isDragging ? 100 : 0,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

export default Sortable;

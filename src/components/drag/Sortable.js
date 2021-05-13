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
    opacity: isDragging ? 0.25 : undefined,
    transform:
      transform && `translate3d(${transform.x}px, ${transform.y}px, 0px)`,
    zIndex: isDragging ? 100 : undefined,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

export default Sortable;

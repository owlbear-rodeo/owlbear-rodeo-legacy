import React from "react";
import { Box } from "theme-ui";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";

function Sortable({ id, children, showDropGutter }) {
  const {
    attributes,
    listeners,
    isDragging,
    transition,
    setDroppableNodeRef,
    setDraggableNodeRef,
  } = useSortable({ id });
  const { setNodeRef: setGroupNodeRef } = useDroppable({
    id: `__group__${id}`,
  });

  const dragStyle = {
    cursor: "pointer",
    opacity: isDragging ? 0.25 : undefined,
    zIndex: isDragging ? 100 : undefined,
    transition,
  };

  // Sort div left aligned
  const sortDropStyle = {
    position: "absolute",
    left: "-5px",
    top: 0,
    width: "2px",
    height: "100%",
    borderRadius: "2px",
  };

  // Group div center aligned
  const groupDropStyle = {
    position: "absolute",
    top: 0,
    left: "50%",
    width: "1px",
    height: "100%",
  };

  return (
    <Box style={{ position: "relative" }}>
      <Box
        ref={setDraggableNodeRef}
        style={dragStyle}
        {...listeners}
        {...attributes}
      >
        {children}
      </Box>
      <Box
        ref={setDroppableNodeRef}
        style={sortDropStyle}
        bg={showDropGutter && "primary"}
      />
      <Box ref={setGroupNodeRef} style={groupDropStyle} />
    </Box>
  );
}

export default Sortable;

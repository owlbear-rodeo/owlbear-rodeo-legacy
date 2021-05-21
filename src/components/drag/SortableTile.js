import React from "react";
import { Box } from "theme-ui";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";

function Sortable({ id, children }) {
  const {
    attributes,
    listeners,
    isDragging,
    setDroppableNodeRef,
    setDraggableNodeRef,
    over,
  } = useSortable({ id });
  const { setNodeRef: setGroupNodeRef } = useDroppable({
    id: `__group__${id}`,
  });

  const dragStyle = {
    cursor: "pointer",
    opacity: isDragging ? 0.25 : undefined,
    zIndex: isDragging ? 100 : undefined,
  };

  // Sort div left aligned
  const sortDropStyle = {
    position: "absolute",
    left: "-5px",
    top: 0,
    width: "2px",
    height: "100%",
    borderRadius: "2px",
    visibility: over?.id === id ? "visible" : "hidden",
  };

  // Group div center aligned
  const groupDropStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderWidth: "4px",
    borderRadius: "4px",
    borderStyle: over?.id === `__group__${id}` ? "solid" : "none",
    pointerEvents: "none",
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
      <Box ref={setDroppableNodeRef} style={sortDropStyle} bg="primary" />
      <Box
        ref={setGroupNodeRef}
        style={groupDropStyle}
        sx={{ borderColor: "primary" }}
      />
    </Box>
  );
}

export default Sortable;

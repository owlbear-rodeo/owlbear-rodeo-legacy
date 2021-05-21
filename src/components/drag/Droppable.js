import React from "react";
import { useDroppable } from "@dnd-kit/core";

function Droppable({ id, children, disabled }) {
  const { setNodeRef } = useDroppable({ id, disabled });

  return <div ref={setNodeRef}>{children}</div>;
}

Droppable.defaultProps = {
  disabled: false,
};

export default Droppable;

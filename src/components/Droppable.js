import React from "react";
import { useDroppable } from "@dnd-kit/core";

function Droppable({ id, children, disabled }) {
  const { setNodeRef } = useDroppable({ id, disabled });

  return (
    <div style={{ width: "100%", height: "100%" }} ref={setNodeRef}>
      {children}
    </div>
  );
}

Droppable.defaultProps = {
  disabled: false,
};

export default Droppable;

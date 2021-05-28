import React from "react";
import { useDroppable } from "@dnd-kit/core";

function Droppable({ id, children, disabled, ...props }) {
  const { setNodeRef } = useDroppable({ id, disabled });

  return (
    <div ref={setNodeRef} {...props}>
      {children}
    </div>
  );
}

Droppable.defaultProps = {
  disabled: false,
};

export default Droppable;

import React from "react";
import { useDroppable } from "@dnd-kit/core";

type DroppableProps = React.HTMLAttributes<HTMLDivElement> & {
  id: string;
  disabled: boolean;
};

function Droppable({ id, children, disabled, ...props }: DroppableProps) {
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

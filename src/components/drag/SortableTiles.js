import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { animated, useSpring, config } from "react-spring";

function SortableTiles({ groups, onGroupChange, renderTile, children }) {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const [dragId, setDragId] = useState();

  function handleDragStart({ active }) {
    setDragId(active.id);
  }

  function handleDragEnd({ active, over }) {
    setDragId();
    if (active && over && active.id !== over.id) {
      const oldIndex = groups.findIndex((group) => group.id === active.id);
      const newIndex = groups.findIndex((group) => group.id === over.id);
      onGroupChange(arrayMove(groups, oldIndex, newIndex));
    }
  }

  const dragBounce = useSpring({
    transform: !!dragId ? "scale(1.05)" : "scale(1)",
    config: config.wobbly,
  });

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext items={groups}>
        {children}
        {createPortal(
          <DragOverlay dropAnimation={null}>
            {dragId && (
              <animated.div style={dragBounce}>
                {renderTile(groups.find((group) => group.id === dragId))}
              </animated.div>
            )}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  );
}

export default SortableTiles;

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { animated, useSpring, config } from "react-spring";

import { combineGroups } from "../../helpers/select";

import SortableTile from "./SortableTile";

function SortableTiles({ groups, onGroupChange, renderTile, renderTiles }) {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const [dragId, setDragId] = useState();
  const [overId, setOverId] = useState();

  function handleDragStart({ active, over }) {
    setDragId(active.id);
    setOverId(over?.id);
  }

  function handleDragMove({ over }) {
    setOverId(over?.id);
  }

  function handleDragEnd({ active, over }) {
    setDragId();
    setOverId();
    if (!active || !over) {
      return;
    }

    if (over.id.startsWith("__group__")) {
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = groups.findIndex((group) => group.id === active.id);
      const newIndex = groups.findIndex((group) => group.id === over.id);
      onGroupChange(arrayMove(groups, oldIndex, newIndex));
    }
  }

  const dragBounce = useSpring({
    transform: !!dragId ? "scale(0.9)" : "scale(1)",
    config: config.wobbly,
  });

  const overGroupId =
    overId && overId.startsWith("__group__") && overId.slice(9);

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <SortableContext items={groups}>
        {renderTiles(
          groups.map((group) => (
            <SortableTile
              id={group.id}
              key={group.id}
              showDropGutter={overId === group.id}
            >
              {dragId && overGroupId === group.id && group.id !== dragId
                ? // If over a group render a preview of that group
                  renderTile(
                    combineGroups(
                      group,
                      groups.find((group) => group.id === dragId)
                    )
                  )
                : renderTile(group)}
            </SortableTile>
          ))
        )}
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

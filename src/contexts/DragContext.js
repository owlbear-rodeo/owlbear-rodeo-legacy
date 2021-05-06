import React, { useState, useContext } from "react";
import { DndContext } from "@dnd-kit/core";

/**
 * @type {React.Context<string|undefined>}
 */
const DragIdContext = React.createContext();

export function DragProvider({ children, onDragEnd }) {
  const [activeDragId, setActiveDragId] = useState(null);

  function handleDragStart({ active }) {
    setActiveDragId(active.id);
  }

  function handleDragEnd(event) {
    setActiveDragId(null);
    onDragEnd && onDragEnd(event);
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <DragIdContext.Provider value={activeDragId}>
        {children}
      </DragIdContext.Provider>
    </DndContext>
  );
}

export function useDragId() {
  const context = useContext(DragIdContext);
  if (context === undefined) {
    throw new Error("useDragId must be used within a DragProvider");
  }
  return context;
}

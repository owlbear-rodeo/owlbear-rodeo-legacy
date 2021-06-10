// eslint-disable-next-line no-unused-vars
import React, { useRef, ReactNode } from "react";
import {
  DndContext,
  useDndContext,
  useDndMonitor,
  // eslint-disable-next-line no-unused-vars
  DragEndEvent,
} from "@dnd-kit/core";

/**
 * Wrap a dnd-kit DndContext with a position monitor to get the
 * active drag element on drag end
 * TODO: use look into fixing this upstream
 * Related: https://github.com/clauderic/dnd-kit/issues/238
 */

/**
 * @typedef DragEndOverlayEvent
 * @property {DOMRect} overlayNodeClientRect
 *
 * @typedef {DragEndEvent & DragEndOverlayEvent} DragEndWithOverlayProps
 */

/**
 * @callback DragEndWithOverlayEvent
 * @param {DragEndWithOverlayProps} props
 */

/**
 * @typedef CustomDragProps
 * @property {DragEndWithOverlayEvent=} onDragEnd
 * @property {ReactNode} children
 */

/**
 * @param {CustomDragProps} props
 */
function DragPositionMonitor({ children, onDragEnd }) {
  const { overlayNode } = useDndContext();

  const overlayNodeClientRectRef = useRef();
  function handleDragMove() {
    if (overlayNode?.nodeRef?.current) {
      overlayNodeClientRectRef.current = overlayNode.nodeRef.current.getBoundingClientRect();
    }
  }

  function handleDragEnd(props) {
    onDragEnd &&
      onDragEnd({
        ...props,
        overlayNodeClientRect: overlayNodeClientRectRef.current,
      });
  }
  useDndMonitor({ onDragEnd: handleDragEnd, onDragMove: handleDragMove });

  return children;
}

/**
 * TODO: Import Props interface from dnd-kit with conversion to Typescript
 * @param {CustomDragProps} props
 */
function DragContext({ children, onDragEnd, ...props }) {
  return (
    <DndContext {...props}>
      <DragPositionMonitor onDragEnd={onDragEnd}>
        {children}
      </DragPositionMonitor>
    </DndContext>
  );
}

export default DragContext;

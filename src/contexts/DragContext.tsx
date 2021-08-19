import { useRef } from "react";
import {
  DndContext,
  useDndContext,
  useDndMonitor,
  DragEndEvent,
} from "@dnd-kit/core";

import { Props } from "@dnd-kit/core/dist/components/DndContext/DndContext";

/**
 * Wrap a dnd-kit DndContext with a position monitor to get the
 * active drag element on drag end
 * TODO: use look into fixing this upstream
 * Related: https://github.com/clauderic/dnd-kit/issues/238
 */

type DragEndWithOverlayEvent = {
  overlayNodeClientRect?: DOMRect;
};

export type CustomDragEndEvent = DragEndWithOverlayEvent & DragEndEvent;

type CustomDragProps = {
  onDragEnd?: (event: CustomDragEndEvent) => void;
};

function DragPositionMonitor({ onDragEnd }: CustomDragProps) {
  const { overlayNode } = useDndContext();

  const overlayNodeClientRectRef = useRef<DOMRect>();
  function handleDragMove() {
    if (overlayNode?.nodeRef?.current) {
      overlayNodeClientRectRef.current =
        overlayNode.nodeRef.current.getBoundingClientRect();
    }
  }

  function handleDragEnd(props: DragEndEvent) {
    onDragEnd &&
      onDragEnd({
        ...props,
        overlayNodeClientRect: overlayNodeClientRectRef.current,
      });
  }
  useDndMonitor({ onDragEnd: handleDragEnd, onDragMove: handleDragMove });

  return null;
}

/**
 * @param {CustomDragProps} props
 */
function DragContext({
  children,
  onDragEnd,
  ...props
}: CustomDragProps & Props) {
  return (
    <DndContext {...props}>
      <DragPositionMonitor onDragEnd={onDragEnd} />
      {children}
    </DndContext>
  );
}

export default DragContext;

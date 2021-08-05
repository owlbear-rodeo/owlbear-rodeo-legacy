import Konva from "konva";
import { Line, Rect } from "react-konva";

import colors from "../../helpers/colors";
import { scaleAndFlattenPoints } from "../../helpers/konva";

import { useGridStrokeWidth } from "../../contexts/GridContext";
import {
  useMapHeight,
  useMapWidth,
  useStageScale,
} from "../../contexts/MapInteractionContext";
import { useUserId } from "../../contexts/UserIdContext";

import {
  Selection as SelectionType,
  SelectionItemType,
} from "../../types/Select";
import { useEffect, useRef } from "react";
import Vector2 from "../../helpers/Vector2";
import { SelectionItemsChangeEventHandler } from "../../types/Events";
import { TokenState } from "../../types/TokenState";
import { Note } from "../../types/Note";
import useGridSnapping from "../../hooks/useGridSnapping";

const dashAnimationSpeed = -0.01;

type SelectionProps = {
  selection: SelectionType;
  onSelectionChange: (selection: SelectionType | null) => void;
  onSelectionItemsChange: SelectionItemsChangeEventHandler;
  onPreventSelectionChange: (preventSelection: boolean) => void;
  onSelectionDragStart: () => void;
  onSelectionDragEnd: () => void;
} & Konva.ShapeConfig;

function Selection({
  selection,
  onSelectionChange,
  onSelectionItemsChange,
  onPreventSelectionChange,
  onSelectionDragStart,
  onSelectionDragEnd,
  ...props
}: SelectionProps) {
  const userId = useUserId();

  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const stageScale = useStageScale();
  const gridStrokeWidth = useGridStrokeWidth();

  const snapPositionToGrid = useGridSnapping();

  const intersectingNodesRef = useRef<
    {
      type: SelectionItemType;
      node: Konva.Node;
      id: string;
      initialX: number;
      initialY: number;
    }[]
  >([]);
  const initialDragPositionRef = useRef({ x: 0, y: 0 });

  function handleDragStart(event: Konva.KonvaEventObject<DragEvent>) {
    initialDragPositionRef.current = event.target.position();
    const stage = event.target.getStage();
    if (stage) {
      for (let item of selection.items) {
        const node = stage.findOne(`#${item.id}`);
        // Don't drag locked nodes
        if (node && !node.name().endsWith("-locked")) {
          intersectingNodesRef.current.push({
            ...item,
            node,
            initialX: node.x(),
            initialY: node.y(),
          });
        }
      }
    }
    onSelectionDragStart();
  }

  function handleDragMove(event: Konva.KonvaEventObject<DragEvent>) {
    const deltaPosition = Vector2.subtract(
      event.target.position(),
      initialDragPositionRef.current
    );
    for (let item of intersectingNodesRef.current) {
      item.node.position(
        snapPositionToGrid(
          Vector2.add({ x: item.initialX, y: item.initialY }, deltaPosition)
        )
      );
    }
  }

  function handleDragEnd(event: Konva.KonvaEventObject<DragEvent>) {
    const tokenChanges: Record<string, Partial<TokenState>> = {};
    const noteChanges: Record<string, Partial<Note>> = {};
    for (let item of intersectingNodesRef.current) {
      if (item.type === "token") {
        tokenChanges[item.id] = {
          x: item.node.x() / mapWidth,
          y: item.node.y() / mapHeight,
          lastModifiedBy: userId,
          lastModified: Date.now(),
        };
      } else {
        noteChanges[item.id] = {
          x: item.node.x() / mapWidth,
          y: item.node.y() / mapHeight,
          lastModifiedBy: userId,
          lastModified: Date.now(),
        };
      }
    }
    onSelectionItemsChange(tokenChanges, noteChanges);
    onSelectionChange({
      ...selection,
      x: event.target.x() / mapWidth,
      y: event.target.y() / mapHeight,
    });
    intersectingNodesRef.current = [];
    onPreventSelectionChange(false);
    onSelectionDragEnd();
  }

  function handlePointerDown() {
    onPreventSelectionChange(true);
  }

  function handlePointerUp() {
    onPreventSelectionChange(false);
  }

  const hasItems = selection.items.length > 0;

  const requestRef = useRef<number>();
  const lineRef = useRef<Konva.Line>(null);
  const rectRef = useRef<Konva.Rect>(null);
  useEffect(() => {
    let prevTime = performance.now();
    function animate(time: number) {
      const delta = time - prevTime;
      prevTime = time;
      if (!hasItems) {
        return;
      }
      requestRef.current = requestAnimationFrame(animate);
      if (lineRef.current) {
        lineRef.current.dashOffset(
          lineRef.current.dashOffset() + delta * dashAnimationSpeed
        );
      }
      if (rectRef.current) {
        rectRef.current.dashOffset(
          rectRef.current.dashOffset() + delta * dashAnimationSpeed
        );
      }
    }

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [hasItems]);

  const strokeWidth = (gridStrokeWidth * 0.75) / stageScale;
  const defaultProps = {
    stroke: colors.primary,
    strokeWidth: strokeWidth,
    dash: hasItems ? [strokeWidth / 2, strokeWidth * 2] : [],
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    draggable: true,
    onMouseDown: handlePointerDown,
    onMouseUp: handlePointerUp,
    onTouchStart: handlePointerDown,
    onTouchEnd: handlePointerUp,
    // Increase stroke width when drawing a selection to
    // prevent deselection click event from firing
    hitStrokeWidth: hasItems ? undefined : 100,
    id: "selection",
  };
  const x = selection.x * mapWidth;
  const y = selection.y * mapHeight;

  if (selection.type === "path") {
    return (
      <Line
        points={scaleAndFlattenPoints(selection.data.points, {
          x: mapWidth,
          y: mapHeight,
        })}
        tension={0.5}
        closed={hasItems}
        lineCap="round"
        lineJoin="round"
        x={x}
        y={y}
        {...defaultProps}
        {...props}
        ref={lineRef}
      />
    );
  } else {
    return (
      <Rect
        x={x}
        y={y}
        offsetX={-selection.data.x * mapWidth}
        offsetY={-selection.data.y * mapHeight}
        width={selection.data.width * mapWidth}
        height={selection.data.height * mapHeight}
        lineCap="round"
        lineJoin="round"
        {...defaultProps}
        {...props}
        ref={rectRef}
      />
    );
  }
}

export default Selection;

import Konva from "konva";
import { Line, Rect } from "react-konva";

import colors from "../../helpers/colors";
import { scaleAndFlattenPoints } from "../../helpers/konva";

import { useGridStrokeWidth } from "../../contexts/GridContext";
import {
  useDebouncedStageScale,
  useMapHeight,
  useMapWidth,
} from "../../contexts/MapInteractionContext";
import { useUserId } from "../../contexts/UserIdContext";

import {
  Selection as SelectionType,
  SelectionItemType,
} from "../../types/Select";
import { useRef } from "react";
import Vector2 from "../../helpers/Vector2";
import { SelectionItemsChangeEventHandler } from "../../types/Events";
import { TokenState } from "../../types/TokenState";
import { Note } from "../../types/Note";

type SelectionProps = {
  selection: SelectionType;
  onSelectionChange: (selection: SelectionType | null) => void;
  onSelectionItemsChange: SelectionItemsChangeEventHandler;
} & Konva.ShapeConfig;

function Selection({
  selection,
  onSelectionChange,
  onSelectionItemsChange,
  ...props
}: SelectionProps) {
  const userId = useUserId();

  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const stageScale = useDebouncedStageScale();
  const gridStrokeWidth = useGridStrokeWidth();

  const intersectingNodesRef = useRef<
    { type: SelectionItemType; node: Konva.Node; id: string }[]
  >([]);
  const previousDragPositionRef = useRef({ x: 0, y: 0 });

  function handleDragStart(event: Konva.KonvaEventObject<DragEvent>) {
    previousDragPositionRef.current = event.target.position();
    const stage = event.target.getStage();
    if (stage) {
      for (let item of selection.items) {
        const node = stage.findOne(`#${item.id}`);
        if (node) {
          intersectingNodesRef.current.push({ ...item, node });
        }
      }
    }
  }

  function handleDragMove(event: Konva.KonvaEventObject<DragEvent>) {
    const deltaPosition = Vector2.subtract(
      event.target.position(),
      previousDragPositionRef.current
    );
    for (let item of intersectingNodesRef.current) {
      item.node.position(Vector2.add(item.node.position(), deltaPosition));
    }
    previousDragPositionRef.current = event.target.position();
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
  }

  function handleClick() {
    onSelectionChange(null);
  }

  const strokeWidth = gridStrokeWidth / stageScale;
  const defaultProps = {
    stroke: colors.primary,
    strokeWidth: strokeWidth,
    dash: [strokeWidth / 2, strokeWidth * 2],
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    draggable: true,
    onClick: handleClick,
    onTap: handleClick,
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
        closed={selection.items.length > 0}
        lineCap="round"
        lineJoin="round"
        x={x}
        y={y}
        {...defaultProps}
        {...props}
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
      />
    );
  }
}

export default Selection;

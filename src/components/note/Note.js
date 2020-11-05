import React, { useContext, useEffect, useState, useRef } from "react";
import { Group, Rect, Text } from "react-konva";

import AuthContext from "../../contexts/AuthContext";
import MapInteractionContext from "../../contexts/MapInteractionContext";

import * as Vector2 from "../../helpers/vector2";
import colors from "../../helpers/colors";

const snappingThreshold = 1 / 5;
const textPadding = 4;

function Note({
  note,
  map,
  onNoteChange,
  onNoteMenuOpen,
  draggable,
  onNoteDragStart,
  onNoteDragEnd,
}) {
  const { userId } = useContext(AuthContext);
  const { mapWidth, mapHeight, setPreventMapInteraction } = useContext(
    MapInteractionContext
  );

  const noteWidth = map && (mapWidth / map.grid.size.x) * note.size;
  const noteHeight = map && (mapHeight / map.grid.size.y) * note.size;

  function handleClick(event) {
    if (draggable) {
      const noteNode = event.target;
      onNoteMenuOpen && onNoteMenuOpen(note.id, noteNode);
    }
  }

  function handleDragStart(event) {
    onNoteDragStart && onNoteDragStart(event, note.id);
  }

  function handleDragMove(event) {
    const noteGroup = event.target;
    // Snap to corners of grid
    if (map.snapToGrid) {
      const offset = Vector2.multiply(map.grid.inset.topLeft, {
        x: mapWidth,
        y: mapHeight,
      });
      const position = {
        x: noteGroup.x() + noteGroup.width() / 2,
        y: noteGroup.y() + noteGroup.height() / 2,
      };
      const gridSize = {
        x:
          (mapWidth *
            (map.grid.inset.bottomRight.x - map.grid.inset.topLeft.x)) /
          map.grid.size.x,
        y:
          (mapHeight *
            (map.grid.inset.bottomRight.y - map.grid.inset.topLeft.y)) /
          map.grid.size.y,
      };
      // Transform into offset space, round, then transform back
      const gridSnap = Vector2.add(
        Vector2.roundTo(Vector2.subtract(position, offset), gridSize),
        offset
      );
      const gridDistance = Vector2.length(Vector2.subtract(gridSnap, position));
      const minGrid = Vector2.min(gridSize);
      if (gridDistance < minGrid * snappingThreshold) {
        noteGroup.x(gridSnap.x - noteGroup.width() / 2);
        noteGroup.y(gridSnap.y - noteGroup.height() / 2);
      }
    }
  }

  function handleDragEnd(event) {
    const noteGroup = event.target;
    onNoteChange &&
      onNoteChange({
        ...note,
        x: noteGroup.x() / mapWidth,
        y: noteGroup.y() / mapHeight,
        lastModifiedBy: userId,
        lastModified: Date.now(),
      });
    onNoteDragEnd && onNoteDragEnd(note.id);
    setPreventMapInteraction(false);
  }

  function handlePointerDown() {
    if (draggable) {
      setPreventMapInteraction(true);
    }
  }

  function handlePointerUp() {
    if (draggable) {
      setPreventMapInteraction(false);
    }
  }

  const [fontSize, setFontSize] = useState(1);
  useEffect(() => {
    const text = textRef.current;
    function findFontSize() {
      // Create an array from 4 to 18 scaled to the note size
      const sizes = Array.from(
        { length: 14 * note.size },
        (_, i) => i + 4 * note.size
      );

      return sizes.reduce((prev, curr) => {
        text.fontSize(curr);
        const width = text.getTextWidth() + textPadding * 2;
        if (width < noteWidth) {
          return curr;
        } else {
          return prev;
        }
      });
    }

    setFontSize(findFontSize());
  }, [note, noteWidth]);

  const textRef = useRef();

  return (
    <Group
      onClick={handleClick}
      onTap={handleClick}
      x={note.x * mapWidth}
      y={note.y * mapHeight}
      width={noteWidth}
      height={noteHeight}
      offsetX={noteWidth / 2}
      offsetY={noteHeight / 2}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
    >
      <Rect
        width={noteWidth}
        height={noteHeight}
        shadowColor="rgba(0, 0, 0, 0.16)"
        shadowOffset={{ x: 0, y: 3 }}
        shadowBlur={6}
        cornerRadius={0.25}
        fill={colors[note.color]}
      />
      <Text
        text={note.text}
        fill="black"
        align="center"
        verticalAlign="middle"
        padding={textPadding}
        fontSize={fontSize}
        wrap="word"
        width={noteWidth}
        height={noteHeight}
        ellipsis={true}
      />
      {/* Use an invisible text block to work out text sizing */}
      <Text visible={false} ref={textRef} text={note.text} wrap="none" />
    </Group>
  );
}

export default Note;

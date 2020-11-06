import React, { useContext, useEffect, useState, useRef } from "react";
import { Rect, Text } from "react-konva";
import { useSpring, animated } from "react-spring/konva";

import AuthContext from "../../contexts/AuthContext";
import MapInteractionContext from "../../contexts/MapInteractionContext";

import { snapNodeToMap } from "../../helpers/map";
import colors from "../../helpers/colors";
import usePrevious from "../../helpers/usePrevious";

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

  function handleDragStart(event) {
    onNoteDragStart && onNoteDragStart(event, note.id);
  }

  function handleDragMove(event) {
    const noteGroup = event.target;
    // Snap to corners of grid
    if (map.snapToGrid) {
      snapNodeToMap(map, mapWidth, mapHeight, noteGroup, snappingThreshold);
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

  function handleClick(event) {
    if (draggable) {
      const noteNode = event.target;
      onNoteMenuOpen && onNoteMenuOpen(note.id, noteNode);
    }
  }

  // Store note pointer down time to check for a click when note is locked
  const notePointerDownTimeRef = useRef();
  function handlePointerDown(event) {
    if (draggable) {
      setPreventMapInteraction(true);
    }
    if (note.locked && map.owner === userId) {
      notePointerDownTimeRef.current = event.evt.timeStamp;
    }
  }

  function handlePointerUp(event) {
    if (draggable) {
      setPreventMapInteraction(false);
    }
    // Check note click when locked and we are the map owner
    // We can't use onClick because that doesn't check pointer distance
    if (note.locked && map.owner === userId) {
      // If down and up time is small trigger a click
      const delta = event.evt.timeStamp - notePointerDownTimeRef.current;
      if (delta < 300) {
        const noteNode = event.target;
        onNoteMenuOpen(note.id, noteNode);
      }
    }
  }

  const [fontSize, setFontSize] = useState(1);
  useEffect(() => {
    const text = textRef.current;

    if (!text) {
      return;
    }

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

  // Animate to new note positions if edited by others
  const noteX = note.x * mapWidth;
  const noteY = note.y * mapHeight;
  const previousWidth = usePrevious(mapWidth);
  const previousHeight = usePrevious(mapHeight);
  const resized = mapWidth !== previousWidth || mapHeight !== previousHeight;
  const skipAnimation = note.lastModifiedBy === userId || resized;
  const props = useSpring({
    x: noteX,
    y: noteY,
    immediate: skipAnimation,
  });

  // When a note is hidden if you aren't the map owner hide it completely
  if (map && !note.visible && map.owner !== userId) {
    return null;
  }

  return (
    <animated.Group
      {...props}
      onClick={handleClick}
      onTap={handleClick}
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
      opacity={note.visible ? 1.0 : 0.5}
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
        fill={
          note.color === "black" || note.color === "darkGray"
            ? "white"
            : "black"
        }
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
    </animated.Group>
  );
}

export default Note;

import { useEffect, useState, useRef } from "react";
import { Rect, Text } from "react-konva";
import Konva from "konva";
import { useSpring, animated } from "@react-spring/konva";

import { useUserId } from "../../contexts/UserIdContext";
import {
  useSetPreventMapInteraction,
  useMapWidth,
  useMapHeight,
} from "../../contexts/MapInteractionContext";
import { useGridCellPixelSize } from "../../contexts/GridContext";

import colors from "../../helpers/colors";

import usePrevious from "../../hooks/usePrevious";
import useGridSnapping from "../../hooks/useGridSnapping";

import { Note as NoteType } from "../../types/Note";
import {
  NoteChangeEventHandler,
  NoteDragEventHandler,
  NoteMenuCloseEventHandler,
  NoteMenuOpenEventHandler,
} from "../../types/Events";
import { Map } from "../../types/Map";

import Transformer from "./Transformer";

const defaultFontSize = 144;
const minFontSize = 16;

type NoteProps = {
  note: NoteType;
  map: Map | null;
  onNoteChange?: NoteChangeEventHandler;
  onNoteMenuOpen?: NoteMenuOpenEventHandler;
  onNoteMenuClose?: NoteMenuCloseEventHandler;
  draggable: boolean;
  onNoteDragStart?: NoteDragEventHandler;
  onNoteDragEnd?: NoteDragEventHandler;
  fadeOnHover: boolean;
  selected: boolean;
};

function Note({
  note,
  map,
  onNoteChange,
  onNoteMenuOpen,
  onNoteMenuClose,
  draggable,
  onNoteDragStart,
  onNoteDragEnd,
  fadeOnHover,
  selected,
}: NoteProps) {
  const userId = useUserId();

  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const setPreventMapInteraction = useSetPreventMapInteraction();

  const gridCellPixelSize = useGridCellPixelSize();

  const minCellSize = Math.min(
    gridCellPixelSize.width,
    gridCellPixelSize.height
  );
  const noteWidth = minCellSize * note.size;
  const noteHeight = noteWidth;
  const notePadding = noteWidth / 10;

  const snapPositionToGrid = useGridSnapping();

  function handleDragStart(event: Konva.KonvaEventObject<DragEvent>) {
    onNoteDragStart?.(event, note.id);
  }

  function handleDragMove(event: Konva.KonvaEventObject<DragEvent>) {
    const noteGroup = event.target;
    // Snap to corners of grid
    if (map?.snapToGrid) {
      noteGroup.position(snapPositionToGrid(noteGroup.position()));
    }
  }

  function handleDragEnd(event: Konva.KonvaEventObject<DragEvent>) {
    const noteGroup = event.target;
    if (userId) {
      onNoteChange?.({
        [note.id]: {
          x: noteGroup.x() / mapWidth,
          y: noteGroup.y() / mapHeight,
          lastModifiedBy: userId,
          lastModified: Date.now(),
        },
      });
    }
    onNoteDragEnd?.(event, note.id);
    setPreventMapInteraction(false);
  }

  function handleClick(event: Konva.KonvaEventObject<MouseEvent>) {
    if (event.evt.button !== 0) {
      return;
    }
    if (draggable) {
      const noteNode = event.target;
      onNoteMenuOpen && onNoteMenuOpen(note.id, noteNode, true);
    }
  }

  // Store note pointer down time to check for a click when note is locked
  const notePointerDownTimeRef = useRef<number>(0);
  function handlePointerDown(event: Konva.KonvaEventObject<PointerEvent>) {
    if (event.evt.button !== 0) {
      return;
    }
    if (draggable) {
      setPreventMapInteraction(true);
    }
    if (note.locked && map?.owner === userId) {
      notePointerDownTimeRef.current = event.evt.timeStamp;
    }
  }

  function handlePointerUp(event: Konva.KonvaEventObject<PointerEvent>) {
    if (event.evt.button !== 0) {
      return;
    }
    if (draggable) {
      setPreventMapInteraction(false);
    }
    // Check note click when locked and we are the map owner
    // We can't use onClick because that doesn't check pointer distance
    if (note.locked && map?.owner === userId) {
      // If down and up time is small trigger a click
      const delta = event.evt.timeStamp - notePointerDownTimeRef.current;
      if (delta < 300) {
        const noteNode = event.target;
        onNoteMenuOpen?.(note.id, noteNode, true);
      }
    }
  }

  const [noteOpacity, setNoteOpacity] = useState(1);
  function handlePointerEnter() {
    if (fadeOnHover) {
      setNoteOpacity(0.5);
    }
  }

  function handlePointerLeave() {
    if (noteOpacity !== 1.0) {
      setNoteOpacity(1.0);
    }
  }

  const [fontScale, setFontScale] = useState(1);
  useEffect(() => {
    const text = textRef.current;
    function findFontSize() {
      if (!text) {
        return;
      }
      // Create an array from 1 / minFontSize of the note height to the full note height
      let sizes = Array.from(
        { length: Math.ceil(noteHeight - notePadding * 2) },
        (_, i) => i + Math.ceil(noteHeight / minFontSize)
      );

      if (sizes.length > 0) {
        const size = sizes.reduce((prev, curr) => {
          text.fontSize(curr);
          const width = text.getTextWidth() + notePadding * 2;
          const height = text.height() + notePadding * 2;
          if (width < noteWidth && height < noteHeight) {
            return curr;
          } else {
            return prev;
          }
        });
        setFontScale(size / defaultFontSize);
      }
    }

    findFontSize();
  }, [note, note.text, note.visible, noteWidth, noteHeight, notePadding]);

  const textRef = useRef<Konva.Text>(null);

  const noteRef = useRef<Konva.Group>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  function handleTransformStart() {
    setIsTransforming(true);
    onNoteMenuClose?.();
  }

  function handleTransformEnd(event: Konva.KonvaEventObject<Event>) {
    if (noteRef.current) {
      const sizeChange = event.target.scaleX();
      const rotation = event.target.rotation();
      onNoteChange?.({
        [note.id]: {
          size: note.size * sizeChange,
          rotation: rotation,
        },
      });
      onNoteMenuOpen?.(note.id, noteRef.current, false);
      noteRef.current.scaleX(1);
      noteRef.current.scaleY(1);
    }
    setIsTransforming(false);
  }

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

  const noteName = `note${note.locked ? "-locked" : ""}`;

  return (
    <>
      <animated.Group
        {...props}
        id={note.id}
        onClick={handleClick}
        onTap={handleClick}
        width={noteWidth}
        height={note.textOnly ? undefined : noteHeight}
        rotation={note.rotation}
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
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        opacity={note.visible ? noteOpacity : 0.5}
        name={noteName}
        ref={noteRef}
      >
        {!note.textOnly && (
          <Rect
            width={noteWidth}
            height={noteHeight}
            shadowColor="rgba(0, 0, 0, 0.16)"
            shadowOffset={{ x: 0, y: 3 }}
            shadowBlur={6}
            cornerRadius={0.25}
            fill={colors[note.color]}
          />
        )}
        <Text
          text={note.text}
          fill={
            note.textOnly
              ? colors[note.color]
              : note.color === "black" || note.color === "darkGray"
              ? "white"
              : "black"
          }
          align="left"
          verticalAlign="middle"
          padding={notePadding / fontScale}
          fontSize={defaultFontSize}
          // Scale font instead of changing font size to avoid kerning issues with Firefox
          scaleX={fontScale}
          scaleY={fontScale}
          width={noteWidth / fontScale}
          height={note.textOnly ? undefined : noteHeight / fontScale}
          wrap="word"
        />
        {/* Use an invisible text block to work out text sizing */}
        <Text visible={false} ref={textRef} text={note.text} wrap="none" />
      </animated.Group>
      <Transformer
        active={(!note.locked && selected) || isTransforming}
        nodes={noteRef.current ? [noteRef.current] : []}
        onTransformEnd={handleTransformEnd}
        onTransformStart={handleTransformStart}
        gridScale={map?.grid.measurement.scale || ""}
      />
    </>
  );
}

Note.defaultProps = {
  fadeOnHover: false,
  draggable: false,
};

export default Note;

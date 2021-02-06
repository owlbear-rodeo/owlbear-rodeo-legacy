import React, { useState, useEffect, useRef } from "react";
import shortid from "shortid";
import { Group } from "react-konva";

import { useMapInteraction } from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useGrid } from "../../contexts/GridContext";

import { getBrushPosition } from "../../helpers/drawing";

import Note from "../note/Note";

const defaultNoteSize = 2;

function MapNotes({
  map,
  active,
  onNoteAdd,
  onNoteChange,
  notes,
  onNoteMenuOpen,
  draggable,
  onNoteDragStart,
  onNoteDragEnd,
  fadeOnHover,
}) {
  const { interactionEmitter } = useMapInteraction();
  const { userId } = useAuth();
  const { gridCellNormalizedSize } = useGrid();
  const mapStageRef = useMapStage();
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [noteData, setNoteData] = useState(null);

  const creatingNoteRef = useRef();

  useEffect(() => {
    if (!active) {
      return;
    }
    const mapStage = mapStageRef.current;

    function handleBrushDown() {
      const brushPosition = getBrushPosition(
        map,
        mapStage,
        map.snapToGrid,
        gridCellNormalizedSize
      );
      setNoteData({
        x: brushPosition.x,
        y: brushPosition.y,
        size: defaultNoteSize,
        text: "",
        id: shortid.generate(),
        lastModified: Date.now(),
        lastModifiedBy: userId,
        visible: true,
        locked: false,
        color: "yellow",
        textOnly: false,
      });
      setIsBrushDown(true);
    }

    function handleBrushMove() {
      if (noteData) {
        const brushPosition = getBrushPosition(
          map,
          mapStage,
          map.snapToGrid,
          gridCellNormalizedSize
        );
        setNoteData((prev) => ({
          ...prev,
          x: brushPosition.x,
          y: brushPosition.y,
        }));
        setIsBrushDown(true);
      }
    }

    function handleBrushUp() {
      if (noteData) {
        onNoteAdd(noteData);
        onNoteMenuOpen(noteData.id, creatingNoteRef.current);
      }
      setNoteData(null);
      setIsBrushDown(false);
    }

    interactionEmitter.on("dragStart", handleBrushDown);
    interactionEmitter.on("drag", handleBrushMove);
    interactionEmitter.on("dragEnd", handleBrushUp);

    return () => {
      interactionEmitter.off("dragStart", handleBrushDown);
      interactionEmitter.off("drag", handleBrushMove);
      interactionEmitter.off("dragEnd", handleBrushUp);
    };
  });

  return (
    <Group>
      {notes.map((note) => (
        <Note
          note={note}
          map={map}
          key={note.id}
          onNoteMenuOpen={onNoteMenuOpen}
          draggable={draggable && !note.locked}
          onNoteChange={onNoteChange}
          onNoteDragStart={onNoteDragStart}
          onNoteDragEnd={onNoteDragEnd}
          fadeOnHover={fadeOnHover}
        />
      ))}
      <Group ref={creatingNoteRef}>
        {isBrushDown && noteData && (
          <Note note={noteData} map={map} draggable={false} />
        )}
      </Group>
    </Group>
  );
}

export default MapNotes;

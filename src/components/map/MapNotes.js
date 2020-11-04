import React, { useContext, useState, useEffect, useRef } from "react";
import shortid from "shortid";
import { Group } from "react-konva";

import MapInteractionContext from "../../contexts/MapInteractionContext";
import MapStageContext from "../../contexts/MapStageContext";
import AuthContext from "../../contexts/AuthContext";

import { getBrushPositionForTool } from "../../helpers/drawing";
import { getRelativePointerPositionNormalized } from "../../helpers/konva";

import MapNote from "./MapNote";

const defaultNoteSize = 2;

function MapNotes({
  map,
  selectedToolSettings,
  active,
  gridSize,
  onNoteAdd,
  onNoteChange,
  notes,
  onNoteMenuOpen,
}) {
  const { interactionEmitter } = useContext(MapInteractionContext);
  const { userId } = useContext(AuthContext);
  const mapStageRef = useContext(MapStageContext);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [noteData, setNoteData] = useState(null);

  const creatingNoteRef = useRef();

  useEffect(() => {
    if (!active) {
      return;
    }
    const mapStage = mapStageRef.current;

    function getBrushPosition() {
      const mapImage = mapStage.findOne("#mapImage");
      return getBrushPositionForTool(
        map,
        getRelativePointerPositionNormalized(mapImage),
        map.snapToGrid,
        false,
        gridSize,
        []
      );
    }

    function handleBrushDown() {
      if (selectedToolSettings.type === "add") {
        const brushPosition = getBrushPosition();
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
        });
        setIsBrushDown(true);
      }
    }

    function handleBrushMove() {
      if (selectedToolSettings.type === "add") {
        const brushPosition = getBrushPosition();
        setNoteData((prev) => ({
          ...prev,
          x: brushPosition.x,
          y: brushPosition.y,
        }));
        setIsBrushDown(true);
      }
    }

    function handleBrushUp() {
      if (selectedToolSettings.type === "add") {
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
        <MapNote
          note={note}
          map={map}
          key={note.id}
          onNoteMenuOpen={onNoteMenuOpen}
          draggable={active && selectedToolSettings.type === "move"}
          onNoteChange={onNoteChange}
        />
      ))}
      <Group ref={creatingNoteRef}>
        {isBrushDown && noteData && (
          <MapNote note={noteData} map={map} draggable={false} />
        )}
      </Group>
    </Group>
  );
}

export default MapNotes;

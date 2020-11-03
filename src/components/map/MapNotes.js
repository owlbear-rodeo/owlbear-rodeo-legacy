import React, { useContext, useState, useEffect } from "react";
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
  notes,
}) {
  const { interactionEmitter } = useContext(MapInteractionContext);
  const { userId } = useContext(AuthContext);
  const mapStageRef = useContext(MapStageContext);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [noteData, setNoteData] = useState(null);

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
      });
      setIsBrushDown(true);
    }

    function handleBrushMove() {
      const brushPosition = getBrushPosition();
      setNoteData((prev) => ({
        ...prev,
        x: brushPosition.x,
        y: brushPosition.y,
      }));
      setIsBrushDown(true);
    }

    function handleBrushUp() {
      onNoteAdd(noteData);
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
        <MapNote note={note} map={map} key={note.id} />
      ))}
      {isBrushDown && noteData && <MapNote note={noteData} map={map} />}
    </Group>
  );
}

export default MapNotes;

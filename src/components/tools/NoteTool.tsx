import { useState, useEffect, useRef } from "react";
import shortid from "shortid";
import { Group } from "react-konva";
import Konva from "konva";

import {
  useInteractionEmitter,
  MapDragEvent,
  leftMouseButton,
} from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";
import { useUserId } from "../../contexts/UserIdContext";

import Vector2 from "../../helpers/Vector2";
import { getRelativePointerPosition } from "../../helpers/konva";

import useGridSnapping from "../../hooks/useGridSnapping";

import BlankNote from "../konva/BlankNote";

import { Map } from "../../types/Map";
import { Note as NoteType } from "../../types/Note";
import {
  NoteCreateEventHander,
  NoteMenuOpenEventHandler,
} from "../../types/Events";

const defaultNoteSize = 2;

type MapNoteProps = {
  map: Map | null;
  active: boolean;
  onNoteCreate: NoteCreateEventHander;
  onNoteMenuOpen: NoteMenuOpenEventHandler;
};

function NoteTool({ map, active, onNoteCreate, onNoteMenuOpen }: MapNoteProps) {
  const interactionEmitter = useInteractionEmitter();
  const userId = useUserId();
  const mapStageRef = useMapStage();
  const [noteData, setNoteData] = useState<NoteType | null>(null);

  const creatingNoteRef = useRef<Konva.Group>(null);

  const snapPositionToGrid = useGridSnapping();

  useEffect(() => {
    if (!active) {
      return;
    }
    const mapStage = mapStageRef.current;

    function getBrushPosition() {
      if (!mapStage) {
        return;
      }
      const mapImage = mapStage.findOne("#mapImage");
      let position = getRelativePointerPosition(mapImage);
      if (!position) {
        return;
      }
      if (map?.snapToGrid) {
        position = snapPositionToGrid(position);
      }
      return Vector2.divide(position, {
        x: mapImage.width(),
        y: mapImage.height(),
      });
    }

    function handleBrushDown(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      const brushPosition = getBrushPosition();
      if (!brushPosition || !userId) {
        return;
      }
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
        rotation: 0,
      });
      if (creatingNoteRef.current) {
        creatingNoteRef.current.visible(true);
      }
    }

    function handleBrushMove(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      if (noteData) {
        const brushPosition = getBrushPosition();
        if (!brushPosition) {
          return;
        }
        setNoteData((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            x: brushPosition.x,
            y: brushPosition.y,
          };
        });
      }
    }

    function handleBrushUp(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      if (noteData && creatingNoteRef.current) {
        onNoteCreate([noteData]);
        onNoteMenuOpen(noteData.id, creatingNoteRef.current, true);
        // Hide creating note tool here as settings noteData to null
        // was causing performance issues in FireFox
        creatingNoteRef.current.visible(false);
      }
    }

    interactionEmitter?.on("dragStart", handleBrushDown);
    interactionEmitter?.on("drag", handleBrushMove);
    interactionEmitter?.on("dragEnd", handleBrushUp);

    return () => {
      interactionEmitter?.off("dragStart", handleBrushDown);
      interactionEmitter?.off("drag", handleBrushMove);
      interactionEmitter?.off("dragEnd", handleBrushUp);
    };
  });

  return (
    <Group ref={creatingNoteRef}>
      {noteData && <BlankNote note={noteData} />}
    </Group>
  );
}

export default NoteTool;

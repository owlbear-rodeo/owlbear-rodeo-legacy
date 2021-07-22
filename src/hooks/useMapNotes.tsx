import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useState } from "react";
import NoteDragOverlay from "../components/note/NoteDragOverlay";
import NoteMenu from "../components/note/NoteMenu";
import NoteTool from "../components/tools/NoteTool";
import {
  NoteChangeEventHandler,
  NoteCreateEventHander,
  NoteRemoveEventHander,
} from "../types/Events";
import { Map, MapToolId } from "../types/Map";
import { MapState } from "../types/MapState";
import { Note, NoteDraggingOptions, NoteMenuOptions } from "../types/Note";

function useMapNotes(
  map: Map | null,
  mapState: MapState | null,
  onNoteCreate: NoteCreateEventHander,
  onNoteChange: NoteChangeEventHandler,
  onNoteRemove: NoteRemoveEventHander,
  selectedToolId: MapToolId,
  allowNoteEditing: boolean
) {
  const [isNoteMenuOpen, setIsNoteMenuOpen] = useState<boolean>(false);
  const [noteMenuOptions, setNoteMenuOptions] = useState<NoteMenuOptions>();
  const [noteDraggingOptions, setNoteDraggingOptions] =
    useState<NoteDraggingOptions>();
  function handleNoteMenuOpen(noteId: string, noteNode: Konva.Node) {
    setNoteMenuOptions({ noteId, noteNode });
    setIsNoteMenuOpen(true);
  }

  function handleNoteDragStart(
    event: KonvaEventObject<DragEvent>,
    noteId: string
  ) {
    setNoteDraggingOptions({ dragging: true, noteId, noteGroup: event.target });
  }

  function handleNoteDragEnd() {
    noteDraggingOptions &&
      setNoteDraggingOptions({ ...noteDraggingOptions, dragging: false });
  }

  function handleNoteRemove(noteIds: string[]) {
    onNoteRemove(noteIds);
    setNoteDraggingOptions(undefined);
  }

  const notes = (
    <NoteTool
      map={map}
      active={selectedToolId === "note"}
      onNoteCreate={onNoteCreate}
      onNoteChange={onNoteChange}
      notes={
        mapState
          ? Object.values(mapState.notes).sort((a, b) =>
              sortNotes(a, b, noteDraggingOptions)
            )
          : []
      }
      onNoteMenuOpen={handleNoteMenuOpen}
      draggable={
        allowNoteEditing &&
        (selectedToolId === "note" || selectedToolId === "move")
      }
      onNoteDragStart={handleNoteDragStart}
      onNoteDragEnd={handleNoteDragEnd}
      fadeOnHover={selectedToolId === "drawing"}
    />
  );

  const noteMenu = (
    <NoteMenu
      isOpen={isNoteMenuOpen}
      onRequestClose={() => setIsNoteMenuOpen(false)}
      onNoteChange={onNoteChange}
      note={noteMenuOptions && mapState?.notes[noteMenuOptions.noteId]}
      noteNode={noteMenuOptions?.noteNode}
      map={map}
    />
  );

  const noteDragOverlay = noteDraggingOptions ? (
    <NoteDragOverlay
      dragging={noteDraggingOptions.dragging}
      noteGroup={noteDraggingOptions.noteGroup}
      noteId={noteDraggingOptions.noteId}
      onNoteRemove={handleNoteRemove}
    />
  ) : null;

  return { notes, noteMenu, noteDragOverlay };
}

export default useMapNotes;

function sortNotes(
  a: Note,
  b: Note,
  noteDraggingOptions?: NoteDraggingOptions
) {
  if (
    noteDraggingOptions &&
    noteDraggingOptions.dragging &&
    noteDraggingOptions.noteId === a.id
  ) {
    // If dragging token `a` move above
    return 1;
  } else if (
    noteDraggingOptions &&
    noteDraggingOptions.dragging &&
    noteDraggingOptions.noteId === b.id
  ) {
    // If dragging token `b` move above
    return -1;
  } else {
    // Else sort so last modified is on top
    return a.lastModified - b.lastModified;
  }
}
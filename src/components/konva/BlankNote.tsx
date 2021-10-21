import { Rect } from "react-konva";

import {
  useMapWidth,
  useMapHeight,
} from "../../contexts/MapInteractionContext";
import { useGridCellPixelSize } from "../../contexts/GridContext";

import colors from "../../helpers/colors";

import { Note as NoteType } from "../../types/Note";

type NoteProps = {
  note: NoteType;
};

function BlankNote({ note }: NoteProps) {
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();

  const gridCellPixelSize = useGridCellPixelSize();

  const minCellSize = Math.min(
    gridCellPixelSize.width,
    gridCellPixelSize.height
  );
  const noteWidth = minCellSize * note.size;
  const noteHeight = noteWidth;

  return (
    <Rect
      x={note.x * mapWidth}
      y={note.y * mapHeight}
      width={noteWidth}
      height={noteHeight}
      offsetX={noteWidth / 2}
      offsetY={noteHeight / 2}
      shadowColor="rgba(0, 0, 0, 0.16)"
      shadowOffset={{ x: 3, y: 6 }}
      shadowBlur={6}
      cornerRadius={0.25}
      fill={colors[note.color]}
    />
  );
}

export default BlankNote;

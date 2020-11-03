import React, { useContext } from "react";
import { Group, Rect } from "react-konva";

import MapInteractionContext from "../../contexts/MapInteractionContext";

function MapNote({ note, map }) {
  const { mapWidth, mapHeight } = useContext(MapInteractionContext);

  const noteWidth = map && (mapWidth / map.grid.size.x) * note.size;
  const noteHeight = map && (mapHeight / map.grid.size.y) * note.size;

  return (
    <Group>
      <Rect
        x={note.x * mapWidth}
        y={note.y * mapHeight}
        width={noteWidth}
        height={noteHeight}
        offsetX={noteWidth / 2}
        offsetY={noteHeight / 2}
        fill="white"
        shadowColor="rgba(0, 0, 0, 0.16)"
        shadowOffset={{ x: 0, y: 3 }}
        shadowBlur={6}
        cornerRadius={1}
      />
    </Group>
  );
}

export default MapNote;

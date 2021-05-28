import React from "react";
import { createPortal } from "react-dom";

import Droppable from "../drag/Droppable";

import { ADD_TO_MAP_ID_PREFIX } from "../../contexts/TileDragContext";

function TilesAddDroppable({ containerSize }) {
  return createPortal(
    <div>
      <Droppable
        id={`${ADD_TO_MAP_ID_PREFIX}-1`}
        style={{
          width: "100vw",
          height: `calc(50vh - ${containerSize.height / 2}px)`,
          position: "absolute",
          top: 0,
        }}
      />
      <Droppable
        id={`${ADD_TO_MAP_ID_PREFIX}-2`}
        style={{
          width: "100vw",
          height: `calc(50vh - ${containerSize.height / 2}px)`,
          position: "absolute",
          bottom: 0,
        }}
      />
      <Droppable
        id={`${ADD_TO_MAP_ID_PREFIX}-3`}
        style={{
          width: `calc(50vw - ${containerSize.width / 2}px)`,
          height: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      <Droppable
        id={`${ADD_TO_MAP_ID_PREFIX}-4`}
        style={{
          width: `calc(50vw - ${containerSize.width / 2}px)`,
          height: "100vh",
          position: "absolute",
          top: 0,
          right: 0,
        }}
      />
    </div>,
    document.body
  );
}

export default TilesAddDroppable;

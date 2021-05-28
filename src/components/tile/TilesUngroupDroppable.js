import React from "react";
import { createPortal } from "react-dom";

import Droppable from "../drag/Droppable";

import { UNGROUP_ID_PREFIX } from "../../contexts/TileDragContext";

function TilesUngroupDroppable({ outerContainerSize, innerContainerSize }) {
  const width = (outerContainerSize.width - innerContainerSize.width) / 2;
  const height = (outerContainerSize.height - innerContainerSize.height) / 2;

  return createPortal(
    <div>
      <Droppable
        id={`${UNGROUP_ID_PREFIX}-1`}
        style={{
          width: outerContainerSize.width,
          height,
          position: "absolute",
          top: `calc(50% - ${innerContainerSize.height / 2 + height}px)`,
          left: `calc(50% - ${outerContainerSize.width / 2}px)`,
        }}
      />
      <Droppable
        id={`${UNGROUP_ID_PREFIX}-2`}
        style={{
          width: outerContainerSize.width,
          height,
          position: "absolute",
          top: `calc(50% + ${innerContainerSize.height / 2}px)`,
          left: `calc(50% - ${outerContainerSize.width / 2}px)`,
        }}
      />
      <Droppable
        id={`${UNGROUP_ID_PREFIX}-3`}
        style={{
          width,
          height: outerContainerSize.height,
          position: "absolute",
          top: `calc(50% - ${outerContainerSize.height / 2}px)`,
          left: `calc(50% - ${innerContainerSize.width / 2 + width}px)`,
        }}
      />
      <Droppable
        id={`${UNGROUP_ID_PREFIX}-4`}
        style={{
          width,
          height: outerContainerSize.height,
          position: "absolute",
          top: `calc(50% - ${outerContainerSize.height / 2}px)`,
          left: `calc(50% + ${innerContainerSize.width / 2}px)`,
        }}
      />
    </div>,
    document.body
  );
}

export default TilesUngroupDroppable;

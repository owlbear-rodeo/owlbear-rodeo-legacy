import React from "react";
import Draggable from "react-draggable";

function Token({ onDrag, position }) {
  return (
    <Draggable onDrag={onDrag} position={position}>
      <div
        style={{
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          background: "blue"
        }}
      ></div>
    </Draggable>
  );
}

export default Token;

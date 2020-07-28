import React, { useState, useContext, useEffect } from "react";
import { Group } from "react-konva";

import AuthContext from "../contexts/AuthContext";

import MapPointer from "../components/map/MapPointer";

function NetworkedMapPointer({ session, active, gridSize }) {
  const { userId } = useContext(AuthContext);
  const [pointerState, setPointerState] = useState({});

  useEffect(() => {
    if (userId && !(userId in pointerState)) {
      setPointerState({
        [userId]: { position: { x: 0, y: 0 }, visible: false, id: userId },
      });
    }
  }, [userId, pointerState]);

  function updateOwnPointerState(position, visible) {
    const update = { [userId]: { position, visible, id: userId } };
    setPointerState((prev) => ({
      ...prev,
      ...update,
    }));
    session.send("pointer", update);
  }

  function handleOwnPointerDown(position) {
    updateOwnPointerState(position, true);
  }

  function handleOwnPointerMove(position) {
    updateOwnPointerState(position, true);
  }

  function handleOwnPointerUp(position) {
    updateOwnPointerState(position, false);
  }

  useEffect(() => {
    function handlePeerData({ id, data }) {
      if (id === "pointer") {
        setPointerState((prev) => ({
          ...prev,
          ...data,
        }));
      }
    }

    session.on("data", handlePeerData);

    return () => {
      session.off("data", handlePeerData);
    };
  });

  return (
    <Group>
      {Object.values(pointerState).map((pointer) => (
        <MapPointer
          key={pointer.id}
          gridSize={gridSize}
          active={pointer.id === userId ? active : false}
          position={pointer.position}
          visible={pointer.visible}
          onPointerDown={pointer.id === userId && handleOwnPointerDown}
          onPointerMove={pointer.id === userId && handleOwnPointerMove}
          onPointerUp={pointer.id === userId && handleOwnPointerUp}
        />
      ))}
    </Group>
  );
}

export default NetworkedMapPointer;

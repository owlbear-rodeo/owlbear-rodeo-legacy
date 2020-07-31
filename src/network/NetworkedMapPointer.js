import React, { useState, useContext, useEffect, useRef } from "react";
import { Group } from "react-konva";

import AuthContext from "../contexts/AuthContext";

import MapPointer from "../components/map/MapPointer";
import { isEmpty } from "../helpers/shared";
import { lerp } from "../helpers/vector2";

// Send pointer updates every 50ms
const sendTickRate = 50;

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

  // Send pointer updates every sendTickRate to peers to save on bandwidth
  const ownPointerUpdateRef = useRef();
  useEffect(() => {
    function sendOwnPointerUpdates() {
      if (ownPointerUpdateRef.current) {
        session.send("pointer", ownPointerUpdateRef.current);
        ownPointerUpdateRef.current = null;
      }
    }
    const sendInterval = setInterval(sendOwnPointerUpdates, sendTickRate);

    return () => {
      clearInterval(sendInterval);
    };
  }, [session]);

  function updateOwnPointerState(position, visible) {
    setPointerState((prev) => ({
      ...prev,
      [userId]: { position, visible, id: userId },
    }));
    ownPointerUpdateRef.current = { position, visible, id: userId };
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

  // Handle pointer data receive
  const syncedPointerStateRef = useRef({});
  useEffect(() => {
    function handlePeerData({ id, data }) {
      if (id === "pointer") {
        // Setup an interpolation to the current pointer data when receiving a pointer event
        if (syncedPointerStateRef.current[data.id]) {
          const from = syncedPointerStateRef.current[data.id].to;
          syncedPointerStateRef.current[data.id] = {
            id: data.id,
            from: {
              ...from,
              time: performance.now(),
            },
            to: {
              ...data,
              time: performance.now() + sendTickRate,
            },
          };
        } else {
          syncedPointerStateRef.current[data.id] = {
            from: null,
            to: { ...data, time: performance.now() + sendTickRate },
          };
        }
      }
    }

    session.on("data", handlePeerData);

    return () => {
      session.off("data", handlePeerData);
    };
  });

  // Animate to the peer pointer positions
  useEffect(() => {
    let request = requestAnimationFrame(animate);

    function animate(time) {
      request = requestAnimationFrame(animate);
      let interpolatedPointerState = {};
      for (let syncState of Object.values(syncedPointerStateRef.current)) {
        if (!syncState.from || !syncState.to) {
          continue;
        }
        const totalInterpTime = syncState.to.time - syncState.from.time;
        const currentInterpTime = time - syncState.from.time;
        const alpha = currentInterpTime / totalInterpTime;

        if (alpha >= 0 && alpha <= 1) {
          interpolatedPointerState[syncState.id] = {
            id: syncState.to.id,
            visible: syncState.from.visible,
            position: lerp(
              syncState.from.position,
              syncState.to.position,
              alpha
            ),
          };
        }
        if (alpha > 1 && !syncState.to.visible) {
          interpolatedPointerState[syncState.id] = {
            id: syncState.id,
            visible: syncState.to.visible,
            position: syncState.to.position,
          };
          delete syncedPointerStateRef.current[syncState.to.id];
        }
      }
      if (!isEmpty(interpolatedPointerState)) {
        setPointerState((prev) => ({
          ...prev,
          ...interpolatedPointerState,
        }));
      }
    }

    return () => {
      cancelAnimationFrame(request);
    };
  }, []);

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

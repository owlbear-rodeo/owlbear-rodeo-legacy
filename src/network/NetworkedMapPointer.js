import React, { useState, useContext, useEffect, useRef } from "react";
import { Group } from "react-konva";

import AuthContext from "../contexts/AuthContext";

import MapPointer from "../components/map/MapPointer";
import { isEmpty } from "../helpers/shared";
import { lerp, compare } from "../helpers/vector2";

// Send pointer updates every 50ms (20fps)
const sendTickRate = 50;

function NetworkedMapPointer({ session, active, gridSize }) {
  const { userId } = useContext(AuthContext);
  const [localPointerState, setLocalPointerState] = useState({});

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (userId && !(userId in localPointerState)) {
      setLocalPointerState({
        [userId]: { position: { x: 0, y: 0 }, visible: false, id: userId },
      });
    }
  }, [userId, localPointerState]);

  // Send pointer updates every sendTickRate to peers to save on bandwidth
  // We use requestAnimationFrame as setInterval was being blocked during
  // re-renders on Chrome with Windows
  const ownPointerUpdateRef = useRef();
  useEffect(() => {
    let prevTime = performance.now();
    let request = requestAnimationFrame(update);
    let counter = 0;
    function update(time) {
      request = requestAnimationFrame(update);
      const deltaTime = time - prevTime;
      counter += deltaTime;
      prevTime = time;

      if (counter > sendTickRate) {
        counter -= sendTickRate;
        if (
          ownPointerUpdateRef.current &&
          sessionRef.current &&
          sessionRef.current.socket
        ) {
          sessionRef.current.socket.emit(
            "player_pointer",
            ownPointerUpdateRef.current
          );
          ownPointerUpdateRef.current = null;
        }
      }
    }

    return () => {
      cancelAnimationFrame(request);
    };
  }, []);

  function updateOwnPointerState(position, visible) {
    setLocalPointerState((prev) => ({
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
  const interpolationsRef = useRef({});
  useEffect(() => {
    // TODO: Handle player disconnect while pointer visible
    function handleSocketPlayerPointer(pointer) {
      const interpolations = interpolationsRef.current;
      const id = pointer.id;
      if (!(id in interpolations)) {
        interpolations[id] = {
          id,
          from: null,
          to: { ...pointer, time: performance.now() + sendTickRate },
        };
      } else if (
        !compare(interpolations[id].to.position, pointer.position, 0.0001) ||
        interpolations[id].to.visible !== pointer.visible
      ) {
        const from = interpolations[id].to;
        interpolations[id] = {
          id,
          from: {
            ...from,
            time: performance.now(),
          },
          to: {
            ...pointer,
            time: performance.now() + sendTickRate,
          },
        };
      }
    }

    if (session.socket) {
      session.socket.on("player_pointer", handleSocketPlayerPointer);
    }

    return () => {
      session.socket.off("player_pointer", handleSocketPlayerPointer);
    };
  }, [session]);

  // Animate to the peer pointer positions
  useEffect(() => {
    let request = requestAnimationFrame(animate);

    function animate() {
      request = requestAnimationFrame(animate);
      const time = performance.now();
      let interpolatedPointerState = {};
      for (let interp of Object.values(interpolationsRef.current)) {
        if (!interp.from || !interp.to) {
          continue;
        }
        const totalInterpTime = interp.to.time - interp.from.time;
        const currentInterpTime = time - interp.from.time;
        const alpha = currentInterpTime / totalInterpTime;

        if (alpha >= 0 && alpha <= 1) {
          interpolatedPointerState[interp.id] = {
            id: interp.id,
            visible: interp.from.visible,
            position: lerp(interp.from.position, interp.to.position, alpha),
          };
        }
        if (alpha > 1 && !interp.to.visible) {
          interpolatedPointerState[interp.id] = {
            id: interp.id,
            visible: interp.to.visible,
            position: interp.to.position,
          };
          delete interpolationsRef.current[interp.id];
        }
      }
      if (!isEmpty(interpolatedPointerState)) {
        setLocalPointerState((prev) => ({
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
      {Object.values(localPointerState).map((pointer) => (
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

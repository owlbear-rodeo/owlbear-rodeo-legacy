import { useState, useEffect, useRef } from "react";
import { Group } from "react-konva";

import { useUserId } from "../contexts/UserIdContext";

import PointerTool from "../components/tools/PointerTool";
import { isEmpty } from "../helpers/shared";
import Vector2 from "../helpers/Vector2";

import useSetting from "../hooks/useSetting";
import Session from "./Session";
import { Color } from "../helpers/colors";
import { PointerState } from "../types/Pointer";

// Send pointer updates every 50ms (20fps)
const sendTickRate = 50;

type InterpolatedPointerState = PointerState & { time: number };

type PointerInterpolation = {
  id: string;
  from: InterpolatedPointerState | null;
  to: InterpolatedPointerState;
};

type NetworkedMapPointerProps = {
  session: Session;
  active: boolean;
};

function NetworkedMapPointer({ session, active }: NetworkedMapPointerProps) {
  const userId = useUserId();
  const [localPointerState, setLocalPointerState] = useState<
    Record<string, PointerState>
  >({});
  const [pointerColor] = useSetting<Color>("pointer.color");

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (userId && !(userId in localPointerState)) {
      setLocalPointerState({
        [userId]: {
          position: { x: 0, y: 0 },
          visible: false,
          id: userId,
          color: pointerColor,
        },
      });
    }
  }, [userId, localPointerState, pointerColor]);

  // Send pointer updates every sendTickRate to peers to save on bandwidth
  // We use requestAnimationFrame as setInterval was being blocked during
  // re-renders on Chrome with Windows
  const ownPointerUpdateRef = useRef<PointerState | null>(null);
  useEffect(() => {
    let prevTime = performance.now();
    let request = requestAnimationFrame(update);
    let counter = 0;
    function update(time: number) {
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
          sessionRef.current.socket.volatile.emit(
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

  function updateOwnPointerState(position: Vector2, visible: boolean) {
    if (!userId) {
      return;
    }
    setLocalPointerState((prev) => ({
      ...prev,
      [userId]: { position, visible, id: userId, color: pointerColor },
    }));
    ownPointerUpdateRef.current = {
      position,
      visible,
      id: userId,
      color: pointerColor,
    };
  }

  function handleOwnPointerDown(position: Vector2) {
    updateOwnPointerState(position, true);
  }

  function handleOwnPointerMove(position: Vector2) {
    updateOwnPointerState(position, true);
  }

  function handleOwnPointerUp(position: Vector2) {
    updateOwnPointerState(position, false);
  }

  // Handle pointer data receive
  const interpolationsRef = useRef<Record<string, PointerInterpolation>>({});
  useEffect(() => {
    // TODO: Handle player disconnect while pointer visible
    function handleSocketPlayerPointer(pointer: InterpolatedPointerState) {
      const interpolations = interpolationsRef.current;
      const id = pointer.id;
      if (!(id in interpolations)) {
        interpolations[id] = {
          id,
          from: null,
          to: { ...pointer, time: performance.now() + sendTickRate },
        };
      } else if (
        !Vector2.compare(
          interpolations[id].to.position,
          pointer.position,
          0.0001
        ) ||
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

    session.socket?.on("player_pointer", handleSocketPlayerPointer);

    return () => {
      session.socket?.off("player_pointer", handleSocketPlayerPointer);
    };
  }, [session]);

  // Animate to the peer pointer positions
  useEffect(() => {
    let request = requestAnimationFrame(animate);

    function animate() {
      request = requestAnimationFrame(animate);
      const time = performance.now();
      let interpolatedPointerState: Record<string, PointerState> = {};
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
            position: Vector2.lerp(
              interp.from.position,
              interp.to.position,
              alpha
            ),
            color: interp.from.color,
          };
        }
        if (alpha > 1 && !interp.to.visible) {
          interpolatedPointerState[interp.id] = {
            id: interp.id,
            visible: interp.to.visible,
            position: interp.to.position,
            color: interp.to.color,
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
        <PointerTool
          key={pointer.id}
          active={pointer.id === userId ? active : false}
          position={pointer.position}
          visible={pointer.visible}
          onPointerDown={
            pointer.id === userId ? handleOwnPointerDown : undefined
          }
          onPointerMove={
            pointer.id === userId ? handleOwnPointerMove : undefined
          }
          onPointerUp={pointer.id === userId ? handleOwnPointerUp : undefined}
          color={pointer.color}
        />
      ))}
    </Group>
  );
}

export default NetworkedMapPointer;

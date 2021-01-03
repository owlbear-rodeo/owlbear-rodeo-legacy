import { useEffect, useState, useRef, useCallback } from "react";

import useDebounce from "./useDebounce";
import { diff, applyChanges } from "./diff";

function useNetworkedState(
  defaultState,
  session,
  eventName,
  debounceRate = 100,
  partialUpdates = true
) {
  const [state, _setState] = useState(defaultState);
  // Used to control whether the state needs to be sent to the socket
  const dirtyRef = useRef(false);

  // Used to force a full update
  const forceUpdateRef = useRef(false);

  // Update dirty at the same time as state
  const setState = useCallback((update, sync = true, force = false) => {
    dirtyRef.current = sync;
    forceUpdateRef.current = force;
    _setState(update);
  }, []);

  const eventNameRef = useRef(eventName);
  useEffect(() => {
    eventNameRef.current = eventName;
  }, [eventName]);

  const debouncedState = useDebounce(state, debounceRate);
  const lastSyncedStateRef = useRef();
  useEffect(() => {
    if (session.socket && dirtyRef.current) {
      // If partial updates enabled, send just the changes to the socket
      if (
        lastSyncedStateRef.current &&
        debouncedState &&
        partialUpdates &&
        !forceUpdateRef.current
      ) {
        const changes = diff(lastSyncedStateRef.current, debouncedState);
        if (changes) {
          session.socket.emit(`${eventName}_update`, changes);
        }
      } else {
        session.socket.emit(eventName, debouncedState);
      }
      dirtyRef.current = false;
      forceUpdateRef.current = false;
      lastSyncedStateRef.current = debouncedState;
    }
  }, [session.socket, eventName, debouncedState, partialUpdates]);

  useEffect(() => {
    function handleSocketEvent(data) {
      _setState(data);
      lastSyncedStateRef.current = data;
    }

    function handleSocketUpdateEvent(changes) {
      _setState((prevState) => {
        let newState = { ...prevState };
        applyChanges(newState, changes);
        lastSyncedStateRef.current = newState;
        return newState;
      });
    }

    session.socket?.on(eventName, handleSocketEvent);
    session.socket?.on(`${eventName}_update`, handleSocketUpdateEvent);
    return () => {
      session.socket?.off(eventName, handleSocketEvent);
      session.socket?.off(`${eventName}_update`, handleSocketUpdateEvent);
    };
  }, [session.socket, eventName]);

  return [state, setState];
}

export default useNetworkedState;

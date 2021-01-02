import { useEffect, useState, useRef, useCallback } from "react";
import { applyChange, diff } from "deep-diff";

import useDebounce from "./useDebounce";

function useNetworkedState(
  defaultState,
  session,
  eventName,
  debounceRate = 100
) {
  const [state, _setState] = useState(defaultState);
  // Used to control whether the state needs to be sent to the socket
  const dirtyRef = useRef(false);

  // Update dirty at the same time as state
  const setState = useCallback((update, sync = true) => {
    dirtyRef.current = sync;
    _setState(update);
  }, []);

  const eventNameRef = useRef(eventName);
  useEffect(() => {
    eventNameRef.current = eventName;
  }, [eventName]);

  const debouncedState = useDebounce(state, debounceRate);
  useEffect(() => {
    if (session.socket && dirtyRef.current) {
      session.socket.emit(eventName, debouncedState);
      dirtyRef.current = false;
    }
  }, [session.socket, eventName, debouncedState]);

  // Store the uncommitted changes so we can re-apply them when receiving new data
  const uncommittedChangesRef = useRef();
  useEffect(() => {
    uncommittedChangesRef.current = diff(debouncedState, state);
  }, [state, debouncedState]);

  useEffect(() => {
    function handleSocketEvent(data) {
      const uncommittedChanges = uncommittedChangesRef.current || [];
      for (let change of uncommittedChanges) {
        applyChange(data, true, change);
      }
      _setState(data);
    }

    session.socket?.on(eventName, handleSocketEvent);
    return () => {
      session.socket?.off(eventName, handleSocketEvent);
    };
  }, [session.socket, eventName]);

  return [state, setState];
}

export default useNetworkedState;

import { useEffect, useState, useRef, useCallback } from "react";

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
    _setState(update);
    dirtyRef.current = sync;
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

  useEffect(() => {
    function handleSocketEvent(data) {
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

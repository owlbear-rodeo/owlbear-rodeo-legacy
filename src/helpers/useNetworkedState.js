import { useEffect, useState, useRef } from "react";

function useNetworkedState(defaultState, session, eventName) {
  const [state, _setState] = useState(defaultState);
  // Used to control whether the state needs to be sent to the socket
  const dirtyRef = useRef(false);

  // Update dirty at the same time as state
  function setState(update, sync = true) {
    dirtyRef.current = sync;
    _setState(update);
  }

  useEffect(() => {
    if (dirtyRef.current) {
      session.socket.emit(eventName, state);
      dirtyRef.current = false;
    }
  }, [state, eventName]);

  return [state, setState];
}

export default useNetworkedState;

import { useEffect, useState } from "react";

function useNetworkedState(defaultState, session, eventName) {
  const [state, _setState] = useState(defaultState);
  // Used to control whether the state needs to be sent to the socket
  const [dirty, setDirty] = useState(false);

  // Update dirty at the same time as state
  function setState(update, sync = true) {
    _setState(update);
    setDirty(sync);
  }

  useEffect(() => {
    if (session.socket && dirty) {
      session.socket.emit(eventName, state);
      setDirty(false);
    }
  }, [session.socket, dirty, eventName, state]);

  return [state, setState];
}

export default useNetworkedState;

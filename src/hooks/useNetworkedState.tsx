import { useEffect, useState, useRef, useCallback } from "react";

import useDebounce from "./useDebounce";
import { diff, applyChanges } from "../helpers/diff";
import Session from "../network/Session";

/**
 * @callback setNetworkedState
 * @param {any} update The updated state or a state function passed into setState
 * @param {boolean} sync Whether to sync the update with the session
 * @param {boolean} force Whether to force a full update, usefull when partialUpdates is enabled
 */
// TODO: check parameter requirements here
type setNetworkedState = (update: any, sync?: boolean, force?: boolean) => void

/**
 * Helper to sync a react state to a `Session`
 *
 * @param {any} initialState
 * @param {Session} session `Session` instance
 * @param {string} eventName Name of the event to send to the session
 * @param {number} debounceRate Amount to debounce before sending to the session (ms)
 * @param {boolean} partialUpdates Allow sending of partial updates to the session
 * @param {string} partialUpdatesKey Key to lookup in the state to identify a partial update
 *
 * @returns {[any, setNetworkedState]}
 */
function useNetworkedState(
  initialState: any,
  session: Session,
  eventName: string,
  debounceRate: number = 500,
  partialUpdates: boolean = true,
  partialUpdatesKey: string = "id"
): [any, setNetworkedState] {
  const [state, _setState] = useState(initialState);
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
          if (!debouncedState) {
            return;
          }
          const update = { id: debouncedState[partialUpdatesKey], changes };
          session.socket.emit(`${eventName}_update`, update);
        }
      } else {
        session.socket.emit(eventName, debouncedState);
      }
      dirtyRef.current = false;
      forceUpdateRef.current = false;
      lastSyncedStateRef.current = debouncedState;
    }
  }, [
    session.socket,
    eventName,
    debouncedState,
    partialUpdates,
    partialUpdatesKey,
  ]);

  useEffect(() => {
    function handleSocketEvent(data: any) {
      _setState(data);
      lastSyncedStateRef.current = data;
    }

    function handleSocketUpdateEvent(update: any) {
      _setState((prevState: any) => {
        if (prevState && prevState[partialUpdatesKey] === update.id) {
          let newState = { ...prevState };
          applyChanges(newState, update.changes);
          if (lastSyncedStateRef.current) {
            applyChanges(lastSyncedStateRef.current, update.changes);
          }
          return newState;
        } else {
          return prevState;
        }
      });
    }

    session.socket?.on(eventName, handleSocketEvent);
    session.socket?.on(`${eventName}_update`, handleSocketUpdateEvent);
    return () => {
      session.socket?.off(eventName, handleSocketEvent);
      session.socket?.off(`${eventName}_update`, handleSocketUpdateEvent);
    };
  }, [session.socket, eventName, partialUpdatesKey]);

  return [state, setState];
}

export default useNetworkedState;

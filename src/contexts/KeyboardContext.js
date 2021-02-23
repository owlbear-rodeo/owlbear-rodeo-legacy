import React, { useEffect, useState, useContext } from "react";
import { EventEmitter } from "events";

const KeyboardContext = React.createContext({ keyEmitter: new EventEmitter() });

export function KeyboardProvider({ children }) {
  const [keyEmitter] = useState(new EventEmitter());
  useEffect(() => {
    function handleKeyDown(event) {
      // Ignore text input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      keyEmitter.emit("keyDown", event);
    }

    function handleKeyUp(event) {
      // Ignore text input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      keyEmitter.emit("keyUp", event);
    }

    document.body.addEventListener("keydown", handleKeyDown);
    document.body.addEventListener("keyup", handleKeyUp);
    document.body.tabIndex = 1;
    return () => {
      document.body.removeEventListener("keydown", handleKeyDown);
      document.body.removeEventListener("keyup", handleKeyUp);
      document.body.tabIndex = 0;
    };
  }, [keyEmitter]);

  return (
    <KeyboardContext.Provider value={{ keyEmitter }}>
      {children}
    </KeyboardContext.Provider>
  );
}

/**
 * @param {KeyboardEvent} onKeyDown
 * @param {KeyboardEvent} onKeyUp
 */
export function useKeyboard(onKeyDown, onKeyUp) {
  const context = useContext(KeyboardContext);
  if (context === undefined) {
    throw new Error("useKeyboard must be used within a KeyboardProvider");
  }
  const { keyEmitter } = context;
  useEffect(() => {
    if (onKeyDown) {
      keyEmitter.on("keyDown", onKeyDown);
    }
    if (onKeyUp) {
      keyEmitter.on("keyUp", onKeyUp);
    }

    return () => {
      if (onKeyDown) {
        keyEmitter.off("keyDown", onKeyDown);
      }
      if (onKeyUp) {
        keyEmitter.off("keyUp", onKeyUp);
      }
    };
  });
}

export default KeyboardContext;

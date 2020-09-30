import React, { useEffect, useState } from "react";
import { EventEmitter } from "events";

const KeyboardContext = React.createContext({ keyEmitter: new EventEmitter() });

export function KeyboardProvider({ children }) {
  const [keyEmitter] = useState(new EventEmitter());
  useEffect(() => {
    function handleKeyDown(event) {
      // Ignore text input
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      keyEmitter.emit("keyDown", event);
    }

    function handleKeyUp(event) {
      // Ignore text input
      if (event.target instanceof HTMLInputElement) {
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

export default KeyboardContext;

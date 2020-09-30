import { useEffect, useContext } from "react";

import KeyboardContext from "../contexts/KeyboardContext";

function useKeyboard(onKeyDown, onKeyUp) {
  const { keyEmitter } = useContext(KeyboardContext);
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

export default useKeyboard;

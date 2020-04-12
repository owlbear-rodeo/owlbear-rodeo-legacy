import { useEffect } from "react";

function usePreventTouch(elementRef) {
  useEffect(() => {
    // Stop 3d touch
    function prevent3DTouch(event) {
      event.preventDefault();
    }
    const element = elementRef.current;
    if (element) {
      element.addEventListener("touchstart", prevent3DTouch, false);
    }

    return () => {
      if (element) {
        element.removeEventListener("touchstart", prevent3DTouch);
      }
    };
  }, [elementRef.current]);
}

export default usePreventTouch;

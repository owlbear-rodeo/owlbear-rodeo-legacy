import { useEffect } from "react";

function usePreventTouch(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    // Stop 3d touch
    function prevent3DTouch(event: TouchEvent) {
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
  }, [elementRef]);
}

export default usePreventTouch;

import { useEffect } from "react";

function usePreventOverscroll(elementRef) {
  useEffect(() => {
    // Stop overscroll on chrome and safari
    // also stop pinch to zoom on chrome
    function preventOverscroll(event) {
      event.preventDefault();
    }
    const element = elementRef.current;
    if (element) {
      element.addEventListener("wheel", preventOverscroll, {
        passive: false,
      });
    }

    return () => {
      if (element) {
        element.removeEventListener("wheel", preventOverscroll);
      }
    };
  }, [elementRef]);
}

export default usePreventOverscroll;

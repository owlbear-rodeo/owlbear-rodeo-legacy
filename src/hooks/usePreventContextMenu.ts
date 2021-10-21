import React, { useEffect } from "react";

function usePreventContextMenu(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    // Stop conext menu i.e. right click dialog
    function preventContextMenu(event: MouseEvent) {
      event.preventDefault();
      return false;
    }
    const element = elementRef.current;
    if (element) {
      element.addEventListener("contextmenu", preventContextMenu, {
        passive: false,
      });
    }

    return () => {
      if (element) {
        element.removeEventListener("contextmenu", preventContextMenu);
      }
    };
  }, [elementRef]);
}

export default usePreventContextMenu;

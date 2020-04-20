import React from "react";
import Modal from "react-modal";

import { useThemeUI } from "theme-ui";

function MapMenu({
  isOpen,
  onRequestClose,
  onModalContent,
  top,
  left,
  bottom,
  right,
  children,
  style,
}) {
  function handleModalContent(node) {
    if (node) {
      // Close modal if interacting with any other element
      function handlePointerDown(event) {
        const path = event.composedPath();
        if (!path.includes(node)) {
          onRequestClose();
          document.body.removeEventListener("pointerdown", handlePointerDown);
        }
      }
      document.body.addEventListener("pointerdown", handlePointerDown);

      // Check for wheel event to close modal as well
      document.body.addEventListener(
        "wheel",
        () => {
          onRequestClose();
        },
        { once: true }
      );
    }
    onModalContent(node);
  }

  const { theme } = useThemeUI();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        overlay: { top: "0", bottom: "initial" },
        content: {
          backgroundColor: theme.colors.overlay,
          top,
          left,
          right,
          bottom,
          padding: 0,
          borderRadius: "4px",
          border: "none",
          ...style,
        },
      }}
      contentRef={handleModalContent}
    >
      {children}
    </Modal>
  );
}

MapMenu.defaultProps = {
  onModalContent: () => {},
  top: "initial",
  left: "initial",
  right: "initial",
  bottom: "initial",
  style: {},
};

export default MapMenu;

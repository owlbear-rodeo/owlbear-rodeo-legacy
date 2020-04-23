import React, { useEffect, useState } from "react";
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
  // A node to exclude from the pointer event for closing
  excludeNode,
}) {
  // Save modal node in state to ensure that the pointer listeners
  // are removed if the open state changed not from the onRequestClose
  // callback
  const [modalContentNode, setModalContentNode] = useState(null);

  useEffect(() => {
    // Close modal if interacting with any other element
    function handlePointerDown(event) {
      const path = event.composedPath();
      if (
        !path.includes(modalContentNode) &&
        !(excludeNode && path.includes(excludeNode))
      ) {
        onRequestClose();
        document.body.removeEventListener("pointerdown", handlePointerDown);
      }
    }

    if (modalContentNode) {
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
    return () => {
      if (modalContentNode) {
        document.body.removeEventListener("pointerdown", handlePointerDown);
      }
    };
  }, [modalContentNode, excludeNode, onRequestClose]);

  function handleModalContent(node) {
    setModalContentNode(node);
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
  excludeNode: null,
};

export default MapMenu;

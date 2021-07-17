import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { useThemeUI } from "theme-ui";
import CSS from "csstype";

import { RequestCloseEventHandler } from "../../types/Events";

type MapMenuProps = {
  isOpen: boolean;
  onRequestClose: RequestCloseEventHandler;
  onModalContent: (instance: HTMLDivElement) => void;
  top: number | string;
  left: number | string;
  bottom: number | string;
  right: number | string;
  children: React.ReactNode;
  style: React.CSSProperties;
  excludeNode: Node | null;
};

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
}: MapMenuProps) {
  // Save modal node in state to ensure that the pointer listeners
  // are removed if the open state changed not from the onRequestClose
  // callback
  const [modalContentNode, setModalContentNode] = useState<Node | null>(null);

  useEffect(() => {
    // Close modal if interacting with any other element
    function handleInteraction(event: Event) {
      const path = event.composedPath();
      if (
        modalContentNode &&
        !path.includes(modalContentNode) &&
        !(excludeNode && path.includes(excludeNode)) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        onRequestClose();
        document.body.removeEventListener("pointerdown", handleInteraction);
        document.body.removeEventListener("wheel", handleInteraction);
      }
    }

    if (modalContentNode) {
      document.body.addEventListener("pointerdown", handleInteraction);
      // Check for wheel event to close modal as well
      document.body.addEventListener("wheel", handleInteraction);
    }

    return () => {
      if (modalContentNode) {
        document.body.removeEventListener("pointerdown", handleInteraction);
      }
    };
  }, [modalContentNode, excludeNode, onRequestClose]);

  function handleModalContent(node: HTMLDivElement) {
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
          backgroundColor: theme.colors?.overlay as CSS.Property.Color,
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

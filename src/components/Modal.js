import React from "react";
import Modal from "react-modal";
import { useThemeUI, Close } from "theme-ui";

function StyledModal({ isOpen, onRequestClose, children }) {
  const { theme } = useThemeUI();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        overlay: { backgroundColor: "rgba(0, 0, 0, 0.73)" },
        content: {
          backgroundColor: theme.colors.background,
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
        },
      }}
    >
      {children}
      <Close
        m={0}
        sx={{ position: "absolute", top: 0, right: 0 }}
        onClick={onRequestClose}
      />
    </Modal>
  );
}

export default StyledModal;

import React from "react";
import Modal from "react-modal";
import { useThemeUI, Close } from "theme-ui";

function Banner({ isOpen, onRequestClose, children }) {
  const { theme } = useThemeUI();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        overlay: { bottom: "0", top: "initial" },
        content: {
          backgroundColor: theme.colors.highlight,
          top: "initial",
          left: "50%",
          right: 0,
          bottom: 0,
          border: "none",
          padding: "8px",
          margin: "8px",
          maxWidth: "500px",
          transform: "translateX(-50%)",
        },
      }}
    >
      {children}
      <Close
        m={0}
        sx={{ position: "absolute", top: "4px", right: 0 }}
        onClick={onRequestClose}
      />
    </Modal>
  );
}

export default Banner;

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
          // Offset for iOS safe zone
          bottom: "env(safe-area-inset-bottom)",
          border: "none",
          padding: "8px",
          margin: "8px",
          paddingRight: "24px",
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

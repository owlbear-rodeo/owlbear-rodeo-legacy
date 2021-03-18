import React from "react";
import Modal from "react-modal";
import { useThemeUI, Close } from "theme-ui";

function Banner({
  isOpen,
  onRequestClose,
  children,
  allowClose,
  backgroundColor,
}) {
  const { theme } = useThemeUI();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        overlay: { bottom: "0", top: "initial", zIndex: 2000 },
        content: {
          backgroundColor: backgroundColor || theme.colors.highlight,
          color: "hsl(210, 50%, 96%)",
          top: "initial",
          left: "50%",
          right: "initial",
          // Offset for iOS safe zone
          bottom: "env(safe-area-inset-bottom)",
          border: "none",
          padding: "8px",
          margin: "8px",
          paddingRight: allowClose ? "24px" : "8px",
          maxWidth: "500px",
          transform: "translateX(-50%)",
        },
      }}
    >
      {children}
      {allowClose && (
        <Close
          m={0}
          sx={{ position: "absolute", top: "4px", right: 0 }}
          onClick={onRequestClose}
        />
      )}
    </Modal>
  );
}

Banner.defaultProps = {
  allowClose: true,
};

export default Banner;

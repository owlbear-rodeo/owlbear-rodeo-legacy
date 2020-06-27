import React from "react";
import Modal from "react-modal";
import { useThemeUI, Close } from "theme-ui";

function StyledModal({
  isOpen,
  onRequestClose,
  children,
  allowClose,
  ...props
}) {
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
          maxHeight: "100%",
        },
      }}
      {...props}
    >
      {/* Stop keyboard events when modal is open to prevent shortcuts from triggering */}
      <div
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        {children}
        {allowClose && (
          <Close
            m={0}
            sx={{ position: "absolute", top: 0, right: 0 }}
            onClick={onRequestClose}
          />
        )}
      </div>
    </Modal>
  );
}

StyledModal.defaultProps = {
  allowClose: true,
};

export default StyledModal;

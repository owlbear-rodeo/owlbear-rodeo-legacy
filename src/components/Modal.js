import React from "react";
import Modal from "react-modal";
import { useThemeUI, Close } from "theme-ui";

import { useSpring, animated, config } from "react-spring";

function StyledModal({
  isOpen,
  onRequestClose,
  children,
  allowClose,
  style,
  ...props
}) {
  const { theme } = useThemeUI();

  const openAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? "scale(1)" : "scale(0.99)",
    config: config.default,
  });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.73)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        content: {
          backgroundColor: theme.colors.background,
          inset: "initial",
          maxHeight: "100%",
          ...style,
        },
      }}
      contentElement={(props, content) => (
        <animated.div {...props} style={{ ...props.style, ...openAnimation }}>
          {content}
        </animated.div>
      )}
      overlayElement={(props, content) => (
        <div
          onDragEnter={(e) => {
            // Prevent drag event from triggering with a modal open
            e.preventDefault();
            e.stopPropagation();
          }}
          {...props}
        >
          {content}
        </div>
      )}
      {...props}
    >
      {children}
      {allowClose && (
        <Close
          m={0}
          sx={{ position: "absolute", top: 0, right: 0 }}
          onClick={onRequestClose}
        />
      )}
    </Modal>
  );
}

StyledModal.defaultProps = {
  allowClose: true,
  style: {},
};

export default StyledModal;

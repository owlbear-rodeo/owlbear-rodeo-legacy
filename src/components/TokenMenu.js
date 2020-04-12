import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import interact from "interactjs";
import { useThemeUI, Box, Input } from "theme-ui";

function TokenMenu({ tokenClassName, onTokenChange }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleRequestClose() {
    setIsOpen(false);
  }

  const [currentToken, setCurrentToken] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);

  function handleLabelChange(event) {
    // Slice to remove Label: text
    const label = event.target.value.slice(7);
    if (label.length <= 1) {
      setCurrentToken((prevToken) => ({
        ...prevToken,
        label: label,
      }));

      onTokenChange({ ...currentToken, label: label });
    }
  }

  useEffect(() => {
    function handleTokenMenuOpen(event) {
      const target = event.target;
      const dataset = (target && target.dataset) || {};
      setCurrentToken({
        image: target.src,
        ...dataset,
      });

      const targetRect = target.getBoundingClientRect();
      setMenuLeft(targetRect.left);
      setMenuTop(targetRect.bottom);

      setIsOpen(true);
    }

    // Add listener for hold gesture
    interact(`.${tokenClassName}`).on("hold", handleTokenMenuOpen);

    function handleMapContextMenu(event) {
      event.preventDefault();
      if (event.target.classList.contains(tokenClassName)) {
        handleTokenMenuOpen(event);
      }
    }

    // Handle context menu on the map level as handling
    // on the token level lead to the default menu still
    // being displayed
    const map = document.querySelector(".map");
    map.addEventListener("contextmenu", handleMapContextMenu);

    return () => {
      map.removeEventListener("contextmenu", handleMapContextMenu);
    };
  }, [tokenClassName]);

  const { theme } = useThemeUI();

  function handleModalContent(node) {
    if (node) {
      console.log(node);
      const tokenLabelInput = node.querySelector("#changeTokenLabel");
      tokenLabelInput.focus();
      // Highlight label section of input
      tokenLabelInput.setSelectionRange(7, 8);
      tokenLabelInput.onblur = () => {
        setIsOpen(false);
      };
      // Check for wheel event to close modal as well
      document.body.addEventListener(
        "wheel",
        () => {
          setIsOpen(false);
        },
        { once: true }
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleRequestClose}
      style={{
        overlay: { top: "0", bottom: "initial" },
        content: {
          backgroundColor: theme.colors.highlight,
          top: `${menuTop}px`,
          left: `${menuLeft}px`,
          right: "initial",
          bottom: "initial",
          padding: 0,
          borderRadius: "4px",
          border: "none",
        },
      }}
      contentRef={handleModalContent}
    >
      <Box
        as="form"
        bg="background"
        onSubmit={(e) => {
          e.preventDefault();
          handleRequestClose();
        }}
        sx={{ width: "72px" }}
      >
        <Input
          id="changeTokenLabel"
          onChange={handleLabelChange}
          value={`Label: ${currentToken.label}`}
          sx={{ padding: "4px" }}
        />
      </Box>
    </Modal>
  );
}

export default TokenMenu;

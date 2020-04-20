import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import interact from "interactjs";
import { Box, Input } from "theme-ui";

import colors, { colorOptions } from "../helpers/colors";

function TokenMenu({ tokenClassName, onTokenChange }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleRequestClose() {
    setIsOpen(false);
  }

  const [currentToken, setCurrentToken] = useState({});
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

  function handleStatusChange(status) {
    const statuses =
      currentToken.status.split(" ").filter((s) => s !== "") || [];
    let newStatuses = [];
    if (statuses.includes(status)) {
      newStatuses = statuses.filter((s) => s !== status);
    } else {
      newStatuses = [...statuses, status];
    }
    const newStatus = newStatuses.join(" ");
    setCurrentToken((prevToken) => ({
      ...prevToken,
      status: newStatus,
    }));
    onTokenChange({ ...currentToken, status: newStatus });
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
    interact(`.${tokenClassName}`).on("tap", handleTokenMenuOpen);

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

  function handleModalContent(node) {
    if (node) {
      const tokenLabelInput = node.querySelector("#changeTokenLabel");
      tokenLabelInput.focus();
      tokenLabelInput.setSelectionRange(7, 8);

      // Close modal if interacting with any other element
      function handlePointerDown(event) {
        const path = event.composedPath();
        if (!path.includes(node)) {
          setIsOpen(false);
          document.body.removeEventListener("pointerdown", handlePointerDown);
        }
      }
      document.body.addEventListener("pointerdown", handlePointerDown);

      // Check for wheel event to close modal as well
      document.body.addEventListener(
        "wheel",
        () => {
          setIsOpen(false);
        },
        { once: true }
      );

      // Ensure menu is in bounds
      const nodeRect = node.getBoundingClientRect();
      const map = document.querySelector(".map");
      const mapRect = map.getBoundingClientRect();
      setMenuLeft((prevLeft) =>
        Math.min(
          mapRect.right - nodeRect.width,
          Math.max(mapRect.left, prevLeft)
        )
      );
      setMenuTop((prevTop) =>
        Math.min(mapRect.bottom - nodeRect.height, prevTop)
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
          backgroundColor: "hsla(230, 25%, 18%, 0.8)",
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
      <Box sx={{ width: "80px" }} p={1}>
        <Box
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleRequestClose();
          }}
        >
          <Input
            id="changeTokenLabel"
            onChange={handleLabelChange}
            value={`Label: ${currentToken.label}`}
            sx={{
              padding: "4px",
              border: "none",
              ":focus": {
                outline: "none",
              },
            }}
            autoComplete="off"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {colorOptions.map((color) => (
            <Box
              key={color}
              sx={{
                width: "33%",
                paddingTop: "33%",
                borderRadius: "50%",
                transform: "scale(0.75)",
                backgroundColor: colors[color],
                cursor: "pointer",
              }}
              onClick={() => handleStatusChange(color)}
            >
              {currentToken.status && currentToken.status.includes(color) && (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    border: "2px solid white",
                    position: "absolute",
                    top: 0,
                    borderRadius: "50%",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Modal>
  );
}

export default TokenMenu;

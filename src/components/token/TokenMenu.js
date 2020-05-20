import React, { useEffect, useState, useRef } from "react";
import interact from "interactjs";
import { Box, Input, Slider, Flex, Text } from "theme-ui";

import MapMenu from "../map/MapMenu";

import colors, { colorOptions } from "../../helpers/colors";

const defaultTokenMaxSize = 6;

/**
 * @callback onTokenChange
 * @param {Object} token the token that was changed
 */

/**
 *
 * @param {string} tokenClassName The class name to attach the interactjs handler to
 * @param {onProxyDragEnd} onTokenChange Called when the the token data is changed
 * @param {Object} tokens An mapping of tokens to use as a base when calling onTokenChange
 * @param {Object} disabledTokens An optional mapping of tokens that shouldn't allow interaction
 */
function TokenMenu({ tokenClassName, onTokenChange, tokens, disabledTokens }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleRequestClose() {
    setIsOpen(false);
  }

  // Store the tokens in a ref and access in the interactjs loop
  // This is needed to stop interactjs from creating multiple listeners
  const tokensRef = useRef(tokens);
  const disabledTokensRef = useRef(disabledTokens);
  useEffect(() => {
    tokensRef.current = tokens;
    disabledTokensRef.current = disabledTokens;
  }, [tokens, disabledTokens]);

  const [currentToken, setCurrentToken] = useState({});
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);
  const [tokenMaxSize, setTokenMaxSize] = useState(defaultTokenMaxSize);

  function handleLabelChange(event) {
    // Slice to remove Label: text
    const label = event.target.value;
    if (label.length <= 1) {
      setCurrentToken((prevToken) => ({
        ...prevToken,
        label: label,
      }));

      onTokenChange({ ...currentToken, label: label });
    }
  }

  function handleStatusChange(status) {
    const statuses = currentToken.statuses;
    let newStatuses = [];
    if (statuses.includes(status)) {
      newStatuses = statuses.filter((s) => s !== status);
    } else {
      newStatuses = [...statuses, status];
    }
    setCurrentToken((prevToken) => ({
      ...prevToken,
      statuses: newStatuses,
    }));
    onTokenChange({ ...currentToken, statuses: newStatuses });
  }

  function handleSizeChange(event) {
    const newSize = parseInt(event.target.value);
    setCurrentToken((prevToken) => ({
      ...prevToken,
      size: newSize,
    }));
    onTokenChange({ ...currentToken, size: newSize });
  }

  useEffect(() => {
    function handleTokenMenuOpen(event) {
      const target = event.target;
      const id = target.getAttribute("data-id");
      if (id in disabledTokensRef.current) {
        return;
      }
      const token = tokensRef.current[id] || {};
      setCurrentToken(token);
      // Set token max size to be higher if needed
      setTokenMaxSize(Math.max(token.size, defaultTokenMaxSize));

      const targetRect = target.getBoundingClientRect();
      setMenuLeft(targetRect.left);
      setMenuTop(targetRect.bottom);

      setIsOpen(true);
    }

    // Add listener for tap gesture
    const tokenInteract = interact(`.${tokenClassName}`).on(
      "tap",
      handleTokenMenuOpen
    );

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
      tokenInteract.unset();
    };
  }, [tokenClassName]);

  function handleModalContent(node) {
    if (node) {
      // Focus input
      const tokenLabelInput = node.querySelector("#changeTokenLabel");
      tokenLabelInput.focus();
      tokenLabelInput.select();

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
    <MapMenu
      isOpen={isOpen}
      onRequestClose={handleRequestClose}
      top={`${menuTop}px`}
      left={`${menuLeft}px`}
      onModalContent={handleModalContent}
    >
      <Box sx={{ width: "156px" }} p={1}>
        <Flex
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleRequestClose();
          }}
          sx={{ alignItems: "center" }}
        >
          <Text
            as="label"
            variant="body2"
            sx={{ width: "45%", fontSize: "16px" }}
            p={1}
          >
            Label:
          </Text>
          <Input
            id="changeTokenLabel"
            onChange={handleLabelChange}
            value={currentToken.label}
            sx={{
              padding: "4px",
              border: "none",
              ":focus": {
                outline: "none",
              },
            }}
            autoComplete="off"
          />
        </Flex>
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
                width: "16.66%",
                paddingTop: "16.66%",
                borderRadius: "50%",
                transform: "scale(0.75)",
                backgroundColor: colors[color],
                cursor: "pointer",
              }}
              onClick={() => handleStatusChange(color)}
              aria-label={`Token label Color ${color}`}
            >
              {currentToken.statuses && currentToken.statuses.includes(color) && (
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
        <Flex sx={{ alignItems: "center" }}>
          <Text
            as="label"
            variant="body2"
            sx={{ width: "40%", fontSize: "16px" }}
            p={1}
          >
            Size:
          </Text>
          <Slider
            value={currentToken.size}
            onChange={handleSizeChange}
            step={1}
            min={1}
            max={tokenMaxSize}
            mr={1}
          />
        </Flex>
      </Box>
    </MapMenu>
  );
}

export default TokenMenu;

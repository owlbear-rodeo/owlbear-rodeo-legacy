import React, { useEffect, useState } from "react";
import { Box, Input, Slider, Flex, Text } from "theme-ui";

import MapMenu from "../map/MapMenu";

import colors, { colorOptions } from "../../helpers/colors";

import usePrevious from "../../helpers/usePrevious";

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
function TokenMenu({
  isOpen,
  onRequestClose,
  tokenState,
  tokenImage,
  onTokenChange,
}) {
  const wasOpen = usePrevious(isOpen);

  const [tokenMaxSize, setTokenMaxSize] = useState(defaultTokenMaxSize);
  useEffect(() => {
    if (isOpen && !wasOpen && tokenState) {
      setTokenMaxSize(Math.max(tokenState.size, defaultTokenMaxSize));
    }
  }, [isOpen, tokenState, wasOpen]);

  function handleLabelChange(event) {
    const label = event.target.value;
    onTokenChange({ ...tokenState, label: label });
  }

  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);

  useEffect(() => {
    if (tokenImage) {
      const imageRect = tokenImage.getClientRect();
      const map = document.querySelector(".map");
      const mapRect = map.getBoundingClientRect();

      // Center X for the menu which is 156px wide
      setMenuLeft(mapRect.left + imageRect.x + imageRect.width / 2 - 156 / 2);
      // Y 12px from the bottom
      setMenuTop(mapRect.top + imageRect.y + imageRect.height + 12);
    }
  }, [tokenImage]);

  function handleStatusChange(status) {
    const statuses = tokenState.statuses;
    let newStatuses = [];
    if (statuses.includes(status)) {
      newStatuses = statuses.filter((s) => s !== status);
    } else {
      newStatuses = [...statuses, status];
    }
    onTokenChange({ ...tokenState, statuses: newStatuses });
  }

  function handleSizeChange(event) {
    const newSize = parseInt(event.target.value);
    onTokenChange({ ...tokenState, size: newSize });
  }

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
      onRequestClose={onRequestClose}
      top={`${menuTop}px`}
      left={`${menuLeft}px`}
      onModalContent={handleModalContent}
    >
      <Box sx={{ width: "156px" }} p={1}>
        <Flex
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            onRequestClose();
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
            value={(tokenState && tokenState.label) || ""}
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
              {tokenState &&
                tokenState.statuses &&
                tokenState.statuses.includes(color) && (
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
            value={(tokenState && tokenState.size) || 1}
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

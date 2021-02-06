import React, { useEffect, useState } from "react";
import { Box, Input, Flex, Text, IconButton } from "theme-ui";

import Slider from "../Slider";

import MapMenu from "../map/MapMenu";

import colors, { colorOptions } from "../../helpers/colors";

import usePrevious from "../../hooks/usePrevious";

import LockIcon from "../../icons/TokenLockIcon";
import UnlockIcon from "../../icons/TokenUnlockIcon";
import ShowIcon from "../../icons/TokenShowIcon";
import HideIcon from "../../icons/TokenHideIcon";

import { useAuth } from "../../contexts/AuthContext";

const defaultTokenMaxSize = 6;
function TokenMenu({
  isOpen,
  onRequestClose,
  tokenState,
  tokenImage,
  onTokenStateChange,
  map,
}) {
  const { userId } = useAuth();

  const wasOpen = usePrevious(isOpen);

  const [tokenMaxSize, setTokenMaxSize] = useState(defaultTokenMaxSize);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);
  useEffect(() => {
    if (isOpen && !wasOpen && tokenState) {
      setTokenMaxSize(Math.max(tokenState.size, defaultTokenMaxSize));
      // Update menu position
      if (tokenImage) {
        const imageRect = tokenImage.getClientRect();
        const mapElement = document.querySelector(".map");
        const mapRect = mapElement.getBoundingClientRect();

        // Center X for the menu which is 156px wide
        setMenuLeft(mapRect.left + imageRect.x + imageRect.width / 2 - 156 / 2);
        // Y 12px from the bottom
        setMenuTop(mapRect.top + imageRect.y + imageRect.height + 12);
      }
    }
  }, [isOpen, tokenState, wasOpen, tokenImage]);

  function handleLabelChange(event) {
    const label = event.target.value.substring(0, 144);
    tokenState &&
      onTokenStateChange({ [tokenState.id]: { ...tokenState, label: label } });
  }

  function handleStatusChange(status) {
    if (!tokenState) {
      return;
    }
    const statuses = new Set(tokenState.statuses.filter((s) => s));
    if (statuses.has(status)) {
      statuses.delete(status);
    } else {
      statuses.add(status);
    }
    onTokenStateChange({
      [tokenState.id]: { ...tokenState, statuses: [...statuses] },
    });
  }

  function handleSizeChange(event) {
    const newSize = parseFloat(event.target.value);
    tokenState &&
      onTokenStateChange({ [tokenState.id]: { ...tokenState, size: newSize } });
  }

  function handleRotationChange(event) {
    const newRotation = parseInt(event.target.value);
    tokenState &&
      onTokenStateChange({
        [tokenState.id]: { ...tokenState, rotation: newRotation },
      });
  }

  function handleVisibleChange() {
    tokenState &&
      onTokenStateChange({
        [tokenState.id]: { ...tokenState, visible: !tokenState.visible },
      });
  }

  function handleLockChange() {
    tokenState &&
      onTokenStateChange({
        [tokenState.id]: { ...tokenState, locked: !tokenState.locked },
      });
  }

  function handleModalContent(node) {
    if (node) {
      // Focus input
      const tokenLabelInput = node.querySelector("#changeTokenLabel");
      tokenLabelInput.focus();
      tokenLabelInput.select();

      // Ensure menu is in bounds
      const nodeRect = node.getBoundingClientRect();
      const mapElement = document.querySelector(".map");
      const mapRect = mapElement.getBoundingClientRect();
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
      <Box sx={{ width: "156px", overflow: "hidden" }} p={1}>
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
            step={0.5}
            min={0.5}
            max={tokenMaxSize}
            mr={1}
          />
        </Flex>
        <Flex sx={{ alignItems: "center" }}>
          <Text
            as="label"
            variant="body2"
            sx={{ width: "95%", fontSize: "16px" }}
            p={1}
          >
            Rotation:
          </Text>
          <Slider
            value={(tokenState && tokenState.rotation) || 0}
            onChange={handleRotationChange}
            step={45}
            min={0}
            max={360}
            mr={1}
          />
        </Flex>
        {/* Only show hide and lock token actions to map owners */}
        {map && map.owner === userId && (
          <Flex sx={{ alignItems: "center", justifyContent: "space-around" }}>
            <IconButton
              onClick={handleVisibleChange}
              title={
                tokenState && tokenState.visible ? "Hide Token" : "Show Token"
              }
              aria-label={
                tokenState && tokenState.visible ? "Hide Token" : "Show Token"
              }
            >
              {tokenState && tokenState.visible ? <ShowIcon /> : <HideIcon />}
            </IconButton>
            <IconButton
              onClick={handleLockChange}
              title={
                tokenState && tokenState.locked ? "Unlock Token" : "Lock Token"
              }
              aria-label={
                tokenState && tokenState.locked ? "Unlock Token" : "Lock Token"
              }
            >
              {tokenState && tokenState.locked ? <LockIcon /> : <UnlockIcon />}
            </IconButton>
          </Flex>
        )}
      </Box>
    </MapMenu>
  );
}

export default TokenMenu;

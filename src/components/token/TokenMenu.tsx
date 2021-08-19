import React, { useEffect, useState } from "react";
import { Box, Input, Flex, Text, IconButton } from "theme-ui";
import Konva from "konva";

import MapMenu from "../map/MapMenu";

import colors, { Color, colorOptions } from "../../helpers/colors";

import usePrevious from "../../hooks/usePrevious";

import LockIcon from "../../icons/TokenLockIcon";
import UnlockIcon from "../../icons/TokenUnlockIcon";
import ShowIcon from "../../icons/TokenShowIcon";
import HideIcon from "../../icons/TokenHideIcon";
import TokenCharacterIcon from "../../icons/TokenCharacterIcon";
import TokenPropIcon from "../../icons/TokenPropIcon";
import TokenMountIcon from "../../icons/TokenMountIcon";
import TokenAttachmentIcon from "../../icons/TokenAttachmentIcon";

import { useUserId } from "../../contexts/UserIdContext";

import {
  RequestCloseEventHandler,
  TokenStateChangeEventHandler,
} from "../../types/Events";
import { TokenState } from "../../types/TokenState";
import { Map } from "../../types/Map";
import { TokenCategory } from "../../types/Token";

const tokenCategories: Record<
  TokenCategory,
  { title: string; icon: React.ReactNode; next: TokenCategory }
> = {
  character: {
    title: "Character",
    icon: <TokenCharacterIcon />,
    next: "prop",
  },
  prop: {
    title: "Prop",
    icon: <TokenPropIcon />,
    next: "vehicle",
  },
  vehicle: {
    title: "Mount",
    icon: <TokenMountIcon />,
    next: "attachment",
  },
  attachment: {
    title: "Attachment",
    icon: <TokenAttachmentIcon />,
    next: "character",
  },
};

type TokenMenuProps = {
  isOpen: boolean;
  onRequestClose: RequestCloseEventHandler;
  tokenState?: TokenState;
  tokenImage?: Konva.Node;
  focus: boolean;
  onTokenStateChange: TokenStateChangeEventHandler;
  map: Map | null;
};

function TokenMenu({
  isOpen,
  onRequestClose,
  tokenState,
  tokenImage,
  focus,
  onTokenStateChange,
  map,
}: TokenMenuProps) {
  const userId = useUserId();

  const wasOpen = usePrevious(isOpen);

  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);
  useEffect(() => {
    if (isOpen && !wasOpen && tokenState) {
      // Update menu position
      if (tokenImage) {
        const imageRect = tokenImage.getClientRect();
        const mapElement = document.querySelector(".map");
        if (mapElement) {
          const mapRect = mapElement.getBoundingClientRect();
          // Center X for the menu which is 156px wide
          setMenuLeft(
            mapRect.left + imageRect.x + imageRect.width / 2 - 156 / 2
          );
          // Y 20px from the bottom
          setMenuTop(mapRect.top + imageRect.y + imageRect.height + 20);
        }
      }
    }
  }, [isOpen, tokenState, wasOpen, tokenImage]);

  function handleLabelChange(event: React.ChangeEvent<HTMLInputElement>) {
    const label = event.target.value.substring(0, 48);
    tokenState && onTokenStateChange({ [tokenState.id]: { label: label } });
  }

  function handleStatusChange(status: Color) {
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
      [tokenState.id]: { statuses: [...statuses] },
    });
  }

  function handleVisibleChange() {
    tokenState &&
      onTokenStateChange({
        [tokenState.id]: { visible: !tokenState.visible },
      });
  }

  function handleLockChange() {
    tokenState &&
      onTokenStateChange({
        [tokenState.id]: { locked: !tokenState.locked },
      });
  }

  function handleCategoryChange() {
    tokenState &&
      onTokenStateChange({
        [tokenState.id]: {
          category: tokenCategories[tokenState.category].next,
        },
      });
  }

  function handleModalContent(node: HTMLElement) {
    if (node) {
      // Focus input
      const tokenLabelInput =
        node.querySelector<HTMLInputElement>("#changeTokenLabel");
      if (tokenLabelInput && focus) {
        tokenLabelInput.focus();
        tokenLabelInput.select();
      }

      // Ensure menu is in bounds
      const nodeRect = node.getBoundingClientRect();
      const mapElement = document.querySelector(".map");
      if (mapElement) {
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
          {colorOptions
            .filter((color) => color !== "primary")
            .map((color) => (
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
        {/* Only show hide and lock token actions to map owners */}
        {map && map.owner === userId && tokenState && (
          <Flex sx={{ alignItems: "center", justifyContent: "space-around" }}>
            <IconButton
              onClick={handleVisibleChange}
              title={tokenState.visible ? "Hide Token" : "Show Token"}
              aria-label={tokenState.visible ? "Hide Token" : "Show Token"}
            >
              {tokenState.visible ? <ShowIcon /> : <HideIcon />}
            </IconButton>
            <IconButton
              onClick={handleLockChange}
              title={tokenState.locked ? "Unlock Token" : "Lock Token"}
              aria-label={tokenState.locked ? "Unlock Token" : "Lock Token"}
            >
              {tokenState.locked ? <LockIcon /> : <UnlockIcon />}
            </IconButton>
            <IconButton
              onClick={handleCategoryChange}
              title={tokenCategories[tokenState.category].title}
              aria-label={tokenCategories[tokenState.category].title}
            >
              {tokenCategories[tokenState.category].icon}
            </IconButton>
          </Flex>
        )}
      </Box>
    </MapMenu>
  );
}

TokenMenu.defaultProps = {
  focus: false,
};

export default TokenMenu;

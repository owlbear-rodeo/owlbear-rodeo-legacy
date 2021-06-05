import React, { useState } from "react";
import { Box, Close, Grid, useThemeUI, IconButton, Text, Flex } from "theme-ui";
import { useSpring, animated, config } from "react-spring";
import ReactResizeDetector from "react-resize-detector";
import SimpleBar from "simplebar-react";

import { useGroup } from "../../contexts/GroupContext";

import TilesUngroupDroppable from "./TilesUngroupDroppable";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

import ChangeNicknameIcon from "../../icons/ChangeNicknameIcon";

import GroupNameModal from "../../modals/GroupNameModal";

import { renameGroup } from "../../helpers/group";

function TilesOverlay({ children }) {
  const {
    groups,
    openGroupId,
    onGroupClose,
    onGroupSelect,
    onGroupsChange,
  } = useGroup();

  const { theme } = useThemeUI();

  const layout = useResponsiveLayout();

  const openAnimation = useSpring({
    opacity: openGroupId ? 1 : 0,
    transform: openGroupId ? "scale(1)" : "scale(0.99)",
    config: config.gentle,
  });

  const [containerSize, setContinerSize] = useState({ width: 0, height: 0 });
  function handleContainerResize(width, height) {
    const size = Math.min(width, height) - 16;
    setContinerSize({ width: size, height: size });
  }

  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  function handleOverlayResize(width, height) {
    setOverlaySize({ width, height });
  }

  const [isGroupNameModalOpen, setIsGroupNameModalOpen] = useState(false);
  function handleGroupNameChange(name) {
    onGroupsChange(renameGroup(groups, openGroupId, name));
    setIsGroupNameModalOpen(false);
  }

  const group = groups.find((group) => group.id === openGroupId);

  return (
    <>
      {openGroupId && (
        <TilesUngroupDroppable
          innerContainerSize={containerSize}
          outerContainerSize={overlaySize}
        />
      )}
      {openGroupId && (
        <ReactResizeDetector
          handleWidth
          handleHeight
          onResize={handleOverlayResize}
        >
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
            }}
            bg="overlay"
          />
        </ReactResizeDetector>
      )}
      <ReactResizeDetector
        handleWidth
        handleHeight
        onResize={handleContainerResize}
      >
        <animated.div
          style={{
            ...openAnimation,
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            pointerEvents: openGroupId ? undefined : "none",
          }}
          onClick={() => openGroupId && onGroupClose()}
        >
          <Box
            sx={{
              width: containerSize.width,
              height: containerSize.height,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: "border",
              cursor: "default",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              position: "relative",
              flexDirection: "column",
            }}
            bg="background"
            onClick={(e) => e.stopPropagation()}
          >
            <Flex my={1} sx={{ position: "relative" }}>
              <Text as="p" my="2px">
                {group?.name}
              </Text>
              <IconButton
                sx={{
                  width: "24px",
                  height: "24px",
                  position: group?.name ? "absolute" : "relative",
                  left: group?.name ? "100%" : 0,
                }}
                title="Edit Group"
                aria-label="Edit Group"
                onClick={() => setIsGroupNameModalOpen(true)}
              >
                <ChangeNicknameIcon />
              </IconButton>
            </Flex>
            <SimpleBar
              style={{
                width: containerSize.width - 16,
                height: containerSize.height - 48,
                marginBottom: "8px",
                backgroundColor: theme.colors.muted,
              }}
              onClick={() => onGroupSelect()}
            >
              <Grid
                sx={{
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
                gap={2}
                columns={`repeat(${layout.groupGridColumns}, 1fr)`}
                p={3}
              >
                {children}
              </Grid>
            </SimpleBar>
            <Close
              onClick={() => onGroupClose()}
              sx={{ position: "absolute", top: 0, right: 0 }}
            />
          </Box>
        </animated.div>
      </ReactResizeDetector>
      <GroupNameModal
        isOpen={isGroupNameModalOpen}
        name={group?.name}
        onSubmit={handleGroupNameChange}
        onRequestClose={() => setIsGroupNameModalOpen(false)}
      />
    </>
  );
}

export default TilesOverlay;

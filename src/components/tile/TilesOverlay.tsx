import React, { useState } from "react";
import { Box, Close, Grid, useThemeUI, IconButton, Text, Flex } from "theme-ui";
import { useSpring, animated, config } from "react-spring";
import ReactResizeDetector from "react-resize-detector";
import SimpleBar from "simplebar-react";

import { useGroup } from "../../contexts/GroupContext";
import { UNGROUP_ID, ADD_TO_MAP_ID } from "../../contexts/TileDragContext";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

import ChangeNicknameIcon from "../../icons/ChangeNicknameIcon";

import GroupNameModal from "../../modals/GroupNameModal";

import { renameGroup } from "../../helpers/group";

import Droppable from "../drag/Droppable";
import { Group } from "../../types/Group";

type TilesOverlayProps = {
  modalSize: { width: number; height: number };
  children: React.ReactNode;
};

function TilesOverlay({ modalSize, children }: TilesOverlayProps) {
  const {
    groups,
    openGroupId,
    onGroupClose,
    onClearSelection,
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
  function handleContainerResize(width?: number, height?: number) {
    if (width && height) {
      const size = Math.min(width, height) - 16;
      setContinerSize({ width: size, height: size });
    }
  }

  const [isGroupNameModalOpen, setIsGroupNameModalOpen] = useState(false);
  function handleGroupNameChange(name: string) {
    if (openGroupId) {
      onGroupsChange(renameGroup(groups, openGroupId, name));
      setIsGroupNameModalOpen(false);
    }
  }

  const group = groups.find((group: Group) => group.id === openGroupId);

  if (!openGroupId) {
    return null;
  }

  const groupName = group && group.type === "group" && group.name;

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
        }}
        bg="overlay"
      />
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
                {groupName}
              </Text>
              <IconButton
                sx={{
                  width: "24px",
                  height: "24px",
                  position: groupName ? "absolute" : "relative",
                  left: groupName ? "100%" : 0,
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
                backgroundColor: theme.colors?.muted as string,
              }}
              onClick={() => onClearSelection()}
            >
              <Grid
                sx={{
                  borderRadius: "4px",
                  overflow: "hidden",
                  position: "relative",
                }}
                gap={2}
                columns={`repeat(${layout.groupGridColumns}, 1fr)`}
                p={3}
              >
                <Droppable
                  id={ADD_TO_MAP_ID}
                  style={{
                    position: "absolute",
                    width: modalSize.width,
                    height: `calc(100% + ${
                      modalSize.height - containerSize.height + 48
                    }px)`,
                    left: `-${
                      (modalSize.width - containerSize.width) / 2 + 8
                    }px`,
                    top: `-${
                      (modalSize.height - containerSize.height) / 2 + 48
                    }px`,
                    zIndex: -1,
                  }}
                />
                <Droppable
                  id={UNGROUP_ID}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: -1,
                  }}
                />
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
        name={groupName || ""}
        onSubmit={handleGroupNameChange}
        onRequestClose={() => setIsGroupNameModalOpen(false)}
      />
    </>
  );
}

export default TilesOverlay;

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Box, Close, Grid, useThemeUI } from "theme-ui";
import { useSpring, animated, config } from "react-spring";
import ReactResizeDetector from "react-resize-detector";
import SimpleBar from "simplebar-react";

import { useGroup } from "../../contexts/GroupContext";
import { UNGROUP_ID_PREFIX } from "../../contexts/TileDragContext";

import Droppable from "../drag/Droppable";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

function TilesOverlay({ children }) {
  const { openGroupId, onGroupClose, onGroupSelect } = useGroup();

  const { theme } = useThemeUI();

  const layout = useResponsiveLayout();

  const openAnimation = useSpring({
    opacity: openGroupId ? 1 : 0,
    transform: openGroupId ? "scale(1)" : "scale(0.99)",
    config: config.gentle,
  });

  const [containerSize, setContinerSize] = useState(0);
  function handleResize(width, height) {
    const size = Math.min(width, height) - 16;
    setContinerSize(size);
  }

  function renderUngroupBoxes() {
    return createPortal(
      <div>
        <Droppable
          id={`${UNGROUP_ID_PREFIX}-1`}
          style={{
            width: "100vw",
            height: `calc(50vh - ${containerSize / 2}px)`,
            position: "absolute",
            top: 0,
          }}
        />
        <Droppable
          id={`${UNGROUP_ID_PREFIX}-2`}
          style={{
            width: "100vw",
            height: `calc(50vh - ${containerSize / 2}px)`,
            position: "absolute",
            bottom: 0,
          }}
        />
        <Droppable
          id={`${UNGROUP_ID_PREFIX}-3`}
          style={{
            width: `calc(50vw - ${containerSize / 2}px)`,
            height: "100vh",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
        <Droppable
          id={`${UNGROUP_ID_PREFIX}-4`}
          style={{
            width: `calc(50vw - ${containerSize / 2}px)`,
            height: "100vh",
            position: "absolute",
            top: 0,
            right: 0,
          }}
        />
      </div>,
      document.body
    );
  }

  return (
    <>
      {openGroupId && renderUngroupBoxes()}
      {openGroupId && (
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
          }}
          bg="overlay"
        />
      )}
      <ReactResizeDetector handleWidth handleHeight onResize={handleResize}>
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
              width: containerSize,
              height: containerSize,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: "border",
              cursor: "default",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              position: "relative",
            }}
            bg="background"
            onClick={(e) => e.stopPropagation()}
          >
            <SimpleBar
              style={{
                width: containerSize - 16,
                height: containerSize - 48,
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
    </>
  );
}

export default TilesOverlay;

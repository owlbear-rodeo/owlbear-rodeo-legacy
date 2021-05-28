import React, { useState } from "react";
import { Box, Close, Grid, useThemeUI } from "theme-ui";
import { useSpring, animated, config } from "react-spring";
import ReactResizeDetector from "react-resize-detector";
import SimpleBar from "simplebar-react";

import { useGroup } from "../../contexts/GroupContext";

import TilesUngroupDroppable from "./TilesUngroupDroppable";

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

  const [containerSize, setContinerSize] = useState({ width: 0, height: 0 });
  function handleContainerResize(width, height) {
    const size = Math.min(width, height) - 16;
    setContinerSize({ width: size, height: size });
  }

  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  function handleOverlayResize(width, height) {
    setOverlaySize({ width, height });
  }

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
              alignItems: "flex-end",
              justifyContent: "center",
              position: "relative",
            }}
            bg="background"
            onClick={(e) => e.stopPropagation()}
          >
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
    </>
  );
}

export default TilesOverlay;

import React, { useEffect, useRef, useState } from "react";
import { Box, IconButton } from "theme-ui";

import RemoveTokenIcon from "../icons/RemoveTokenIcon";

function DragOverlay({ dragging, node, onRemove }) {
  const [isRemoveHovered, setIsRemoveHovered] = useState(false);
  const removeTokenRef = useRef();

  // Detect token hover on remove icon manually to support touch devices
  useEffect(() => {
    const map = document.querySelector(".map");
    const mapRect = map.getBoundingClientRect();

    function detectRemoveHover() {
      if (!node || !dragging || !removeTokenRef.current) {
        return;
      }

      const pointerPosition = node.getStage().getPointerPosition();
      const screenSpacePointerPosition = {
        x: pointerPosition.x + mapRect.left,
        y: pointerPosition.y + mapRect.top,
      };
      const removeIconPosition = removeTokenRef.current.getBoundingClientRect();

      if (
        screenSpacePointerPosition.x > removeIconPosition.left &&
        screenSpacePointerPosition.y > removeIconPosition.top &&
        screenSpacePointerPosition.x < removeIconPosition.right &&
        screenSpacePointerPosition.y < removeIconPosition.bottom
      ) {
        if (!isRemoveHovered) {
          setIsRemoveHovered(true);
        }
      } else if (isRemoveHovered) {
        setIsRemoveHovered(false);
      }
    }

    let handler;
    if (node && dragging) {
      handler = setInterval(detectRemoveHover, 100);
    }

    return () => {
      if (handler) {
        clearInterval(handler);
      }
    };
  }, [isRemoveHovered, dragging, node]);

  // Detect drag end of token image and remove it if it is over the remove icon
  useEffect(() => {
    if (!dragging && node && isRemoveHovered) {
      onRemove();
    }
  });

  return (
    dragging && (
      <Box
        sx={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          borderRadius: "50%",
          transform: isRemoveHovered
            ? "translateX(-50%) scale(2.0)"
            : "translateX(-50%) scale(1.5)",
          transition: "transform 250ms ease",
          color: isRemoveHovered ? "primary" : "text",
          pointerEvents: "none",
        }}
        bg="overlay"
        ref={removeTokenRef}
      >
        <IconButton>
          <RemoveTokenIcon />
        </IconButton>
      </Box>
    )
  );
}

export default DragOverlay;

import { useEffect, useRef, useState } from "react";
import { Box, IconButton } from "theme-ui";

import RemoveTokenIcon from "../../icons/RemoveTokenIcon";
import { useMapStage } from "../../contexts/MapStageContext";

type DragOverlayProps = {
  dragging: boolean;
  onRemove: () => void;
};

function DragOverlay({ dragging, onRemove }: DragOverlayProps) {
  const [isRemoveHovered, setIsRemoveHovered] = useState(false);
  const removeTokenRef = useRef<HTMLDivElement>(null);

  const mapStageRef = useMapStage();

  // Detect token hover on remove icon manually to support touch devices
  useEffect(() => {
    function detectRemoveHover() {
      const mapStage = mapStageRef.current;
      if (!mapStage || !dragging || !removeTokenRef.current) {
        return;
      }
      const map = document.querySelector(".map");
      if (!map) {
        return;
      }
      const mapRect = map.getBoundingClientRect();
      const pointerPosition = mapStage.getPointerPosition();
      if (!pointerPosition) {
        return;
      }
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

    let handler: NodeJS.Timeout;
    if (dragging) {
      handler = setInterval(detectRemoveHover, 100);
    }

    return () => {
      if (handler) {
        clearInterval(handler);
      }
    };
  }, [isRemoveHovered, dragging, mapStageRef]);

  // Detect drag end of token image and remove it if it is over the remove icon
  useEffect(() => {
    if (!dragging && isRemoveHovered) {
      onRemove();
    }
  });

  if (!dragging) {
    return null;
  }

  return (
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
  );
}

export default DragOverlay;

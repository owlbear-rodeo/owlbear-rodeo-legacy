import React, { useContext, useEffect, useRef, useState } from "react";
import { Box, IconButton } from "theme-ui";

import RemoveTokenIcon from "../../icons/RemoveTokenIcon";

import AuthContext from "../../contexts/AuthContext";
import MapInteractionContext from "../../contexts/MapInteractionContext";

function TokenDragOverlay({
  onTokenStateRemove,
  onTokenStateChange,
  token,
  tokenState,
  tokenGroup,
  dragging,
  mapState,
}) {
  const { userId } = useContext(AuthContext);
  const { setPreventMapInteraction, mapWidth, mapHeight } = useContext(
    MapInteractionContext
  );

  const [isRemoveHovered, setIsRemoveHovered] = useState(false);
  const removeTokenRef = useRef();

  // Detect token hover on remove icon manually to support touch devices
  useEffect(() => {
    const map = document.querySelector(".map");
    const mapRect = map.getBoundingClientRect();

    function detectRemoveHover() {
      if (!tokenGroup) {
        return;
      }

      const pointerPosition = tokenGroup.getStage().getPointerPosition();
      const screenSpacePointerPosition = {
        x: pointerPosition.x + mapRect.left,
        y: pointerPosition.y + mapRect.top,
      };
      if (!removeTokenRef.current) {
        return;
      }
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
    if (tokenState && tokenGroup && dragging) {
      handler = setInterval(detectRemoveHover, 100);
    }

    return () => {
      if (handler) {
        clearInterval(handler);
      }
    };
  }, [tokenState, tokenGroup, isRemoveHovered, dragging]);

  // Detect drag end of token image and remove it if it is over the remove icon
  useEffect(() => {
    function handleTokenDragEnd() {
      // Handle other tokens when a vehicle gets deleted
      if (token && token.category === "vehicle") {
        const layer = tokenGroup.getLayer();
        const mountedTokens = tokenGroup.find(".token");
        for (let mountedToken of mountedTokens) {
          // Save and restore token position after moving layer
          const position = mountedToken.absolutePosition();
          mountedToken.moveTo(layer);
          mountedToken.absolutePosition(position);
          onTokenStateChange({
            [mountedToken.id()]: {
              ...mapState.tokens[mountedToken.id()],
              x: mountedToken.x() / mapWidth,
              y: mountedToken.y() / mapHeight,
              lastModifiedBy: userId,
              lastModified: Date.now(),
            },
          });
        }
      }
      onTokenStateRemove(tokenState);
      setPreventMapInteraction(false);
    }

    if (!dragging && tokenState && isRemoveHovered) {
      handleTokenDragEnd();
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

export default TokenDragOverlay;

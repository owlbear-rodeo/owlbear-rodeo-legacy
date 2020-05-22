import React, { useContext } from "react";
import { Box, IconButton } from "theme-ui";

import RemoveTokenIcon from "../../icons/RemoveTokenIcon";

import AuthContext from "../../contexts/AuthContext";
import MapInteractionContext from "../../contexts/MapInteractionContext";

function TokenDragOverlay({
  onTokenStateRemove,
  onTokenStateChange,
  token,
  tokenState,
  tokenImage,
  mapState,
}) {
  const { userId } = useContext(AuthContext);
  const { setPreventMapInteraction, mapWidth, mapHeight } = useContext(
    MapInteractionContext
  );

  function handleTokenRemove() {
    // Handle other tokens when a vehicle gets deleted
    if (token.isVehicle) {
      const layer = tokenImage.getLayer();
      const mountedTokens = tokenImage.find(".token");
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
            lastEditedBy: userId,
          },
        });
      }
    }
    onTokenStateRemove(tokenState);
    setPreventMapInteraction(false);
  }

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: "24px",
        left: "50%",
        borderRadius: "50%",
        transform: "translateX(-50%) scale(1.5)",
        transition: "transform 250ms ease",
        ":hover": {
          transform: "translateX(-50%) scale(2.0)",
        },
      }}
      bg="overlay"
      onMouseUp={handleTokenRemove}
      onTouchEnd={handleTokenRemove}
    >
      <IconButton>
        <RemoveTokenIcon />
      </IconButton>
    </Box>
  );
}

export default TokenDragOverlay;

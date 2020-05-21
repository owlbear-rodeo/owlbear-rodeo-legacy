import React, { useContext } from "react";
import { Box, IconButton } from "theme-ui";

import RemoveTokenIcon from "../../icons/RemoveTokenIcon";

import MapInteractionContext from "../../contexts/MapInteractionContext";

function TokenDragOverlay({ onTokenStateRemove }) {
  const { setPreventMapInteraction } = useContext(MapInteractionContext);

  function handleTokenRemove() {
    onTokenStateRemove();
    setPreventMapInteraction(false);
  }

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: "12px",
        left: "50%",
        borderRadius: "50%",
        transform: "translateX(-50%)",
        transition: "transform 250ms ease",
        ":hover": {
          transform: "translateX(-50%) scale(1.5)",
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

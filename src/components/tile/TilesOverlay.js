import React from "react";
import { Box, Close } from "theme-ui";

import { useGroup } from "../../contexts/GroupContext";

function TilesOverlay({ children }) {
  const { openGroupId, onGroupClose } = useGroup();

  if (!openGroupId) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        cursor: "pointer",
      }}
      p={3}
      bg="overlay"
      onClick={() => onGroupClose()}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          border: "1px solid",
          borderColor: "border",
          cursor: "default",
        }}
        bg="muted"
        onClick={(e) => e.stopPropagation()}
        p={3}
      >
        {children}
      </Box>
      <Close
        onClick={() => onGroupClose()}
        sx={{ position: "absolute", top: "16px", right: "16px" }}
      />
    </Box>
  );
}

export default TilesOverlay;

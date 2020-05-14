import React from "react";
import { Box, Text } from "theme-ui";

function DiceButtonCount({ children }) {
  return (
    <Box
      sx={{
        position: "absolute",
        left: "50%",
        bottom: "100%",
        transform: "translateX(-50%)",
        height: "14px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Text
        variant="caption"
        as="p"
        color="text"
        sx={{ fontSize: "10px", fontWeight: "bold" }}
      >
        {children}×
      </Text>
    </Box>
  );
}

export default DiceButtonCount;

import React from "react";
import { Box, Text } from "theme-ui";

function DiceButtonCount({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        right: "90%",
        transform: "translateY(-50%)",
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
        {children}
      </Text>
    </Box>
  );
}

export default DiceButtonCount;

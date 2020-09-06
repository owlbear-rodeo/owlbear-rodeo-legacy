import React from "react";
import { Flex, Image, Text, Box } from "theme-ui";

function DiceTile({ dice, isSelected, onDiceSelect, onDone, large }) {
  return (
    <Flex
      onClick={() => onDiceSelect(dice)}
      sx={{
        position: "relative",
        width: large ? "49%" : "32%",
        height: "0",
        paddingTop: large ? "49%" : "32%",
        borderRadius: "4px",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
      }}
      my={1}
      bg="muted"
      onDoubleClick={() => onDone(dice)}
    >
      <Image
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        src={dice.preview}
      />
      <Flex
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.65) 100%);",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
        p={2}
      >
        <Text
          as="p"
          variant="heading"
          color="hsl(210, 50%, 96%)"
          sx={{ textAlign: "center" }}
        >
          {dice.name}
        </Text>
      </Flex>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          borderColor: "primary",
          borderStyle: isSelected ? "solid" : "none",
          borderWidth: "4px",
          pointerEvents: "none",
          borderRadius: "4px",
        }}
      />
    </Flex>
  );
}

export default DiceTile;

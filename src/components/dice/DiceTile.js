import React from "react";
import { Flex, Image, Text } from "theme-ui";

function DiceTile({ dice, isSelected, onDiceSelect, onDone }) {
  return (
    <Flex
      onClick={() => onDiceSelect(dice)}
      sx={{
        borderColor: "primary",
        borderStyle: isSelected ? "solid" : "none",
        borderWidth: "4px",
        position: "relative",
        width: "150px",
        height: "150px",
        borderRadius: "4px",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
      }}
      m={2}
      bg="muted"
      onDoubleClick={() => onDone(dice)}
    >
      <Image
        sx={{ width: "100%", height: "100%", objectFit: "contain" }}
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
    </Flex>
  );
}

export default DiceTile;

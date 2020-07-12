import React from "react";
import { Flex, Image, Text, Box, IconButton } from "theme-ui";

import RemoveTokenIcon from "../../icons/RemoveTokenIcon";

import useDataSource from "../../helpers/useDataSource";
import {
  tokenSources as defaultTokenSources,
  unknownSource,
} from "../../tokens";

function TokenTile({ token, isSelected, onTokenSelect, onTokenRemove }) {
  const tokenSource = useDataSource(token, defaultTokenSources, unknownSource);
  const isDefault = token.type === "default";

  return (
    <Flex
      onClick={() => onTokenSelect(token)}
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
    >
      <Image
        sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        src={tokenSource}
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
          {token.name}
        </Text>
      </Flex>
      {isSelected && !isDefault && (
        <Box sx={{ position: "absolute", top: 0, right: 0 }}>
          <IconButton
            aria-label="Remove Token"
            title="Remove Token"
            onClick={() => {
              onTokenRemove(token.id);
            }}
            bg="overlay"
            sx={{ borderRadius: "50%" }}
            m={1}
          >
            <RemoveTokenIcon />
          </IconButton>
        </Box>
      )}
    </Flex>
  );
}

export default TokenTile;

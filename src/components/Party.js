import React from "react";
import { Flex, Box, Text } from "theme-ui";

import AddPartyMemberButton from "./AddPartyMemberButton";

function Party({ nicknames, peerId, onNicknameChange }) {
  return (
    <Flex
      p={3}
      bg="background"
      sx={{
        flexDirection: "column",
        width: "96px",
        minWidth: "96px",
        overflowY: "auto",
        alignItems: "center"
      }}
    >
      <Box
        sx={{
          width: "100%"
        }}
      >
        <Text mb={1} variant="heading">
          Party
        </Text>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          width: "100%"
        }}
      >
        {Object.entries(nicknames).map(([id, nickname]) => (
          <Text my={1} variant="caption" sx={{ fontSize: 10 }} key={id}>
            {nickname} {id === peerId ? "(you)" : ""}
          </Text>
        ))}
      </Box>
      <Box>
        <AddPartyMemberButton peerId={peerId} />
      </Box>
    </Flex>
  );
}

export default Party;

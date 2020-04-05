import React from "react";
import { Flex, Box, Text } from "theme-ui";

import AddPartyMemberButton from "./AddPartyMemberButton";

function Party({ nickname, partyNicknames, gameId, onNicknameChange }) {
  return (
    <Flex
      p={3}
      bg="background"
      sx={{
        flexDirection: "column",
        width: "96px",
        minWidth: "96px",
        overflowY: "auto",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
        }}
      >
        <Text mb={1} variant="heading">
          Party
        </Text>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          width: "100%",
        }}
      >
        <Text my={1} variant="caption" sx={{ fontSize: 10 }}>
          {nickname || ""} (you)
        </Text>
        {Object.entries(partyNicknames).map(([id, partyNickname]) => (
          <Text my={1} variant="caption" sx={{ fontSize: 10 }} key={id}>
            {partyNickname}
          </Text>
        ))}
      </Box>
      <Box>
        <AddPartyMemberButton gameId={gameId} />
      </Box>
    </Flex>
  );
}

export default Party;

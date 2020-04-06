import React from "react";
import { Flex, Box, Text } from "theme-ui";

import AddPartyMemberButton from "./AddPartyMemberButton";
import Nickname from "./Nickname";

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
        <Nickname
          nickname={nickname || ""}
          allowChanging
          onChange={onNicknameChange}
        />
        {Object.entries(partyNicknames).map(([id, partyNickname]) => (
          <Nickname nickname={partyNickname} key={id} />
        ))}
      </Box>
      <Box>
        <AddPartyMemberButton gameId={gameId} />
      </Box>
    </Flex>
  );
}

export default Party;

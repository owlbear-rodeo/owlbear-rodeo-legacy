import React from "react";
import { Flex, Box, Text } from "theme-ui";

import AddPartyMemberButton from "./AddPartyMemberButton";
import Nickname from "./Nickname";
import ChangeNicknameButton from "./ChangeNicknameButton";
import StartStreamButton from "./StartStreamButton";

function Party({
  nickname,
  partyNicknames,
  gameId,
  onNicknameChange,
  stream,
  partyStreams,
  onStreamStart,
  onStreamEnd,
}) {
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
        <Text mb={1} variant="heading" as="h1">
          Party
        </Text>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          width: "100%",
        }}
      >
        <Nickname nickname={nickname || ""} />
        {Object.entries(partyNicknames).map(([id, partyNickname]) => (
          <Nickname
            nickname={partyNickname}
            key={id}
            stream={partyStreams[id]}
          />
        ))}
      </Box>
      <Flex sx={{ flexDirection: "column" }}>
        <ChangeNicknameButton nickname={nickname} onChange={onNicknameChange} />
        <StartStreamButton
          onStreamStart={onStreamStart}
          onStreamEnd={onStreamEnd}
          stream={stream}
        />
        <AddPartyMemberButton gameId={gameId} />
      </Flex>
    </Flex>
  );
}

export default Party;

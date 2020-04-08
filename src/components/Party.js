import React from "react";
import { Flex, Box, Text } from "theme-ui";

import AddPartyMemberButton from "./AddPartyMemberButton";
import Nickname from "./Nickname";
import Stream from "./Stream";

function Party({
  nickname,
  partyNicknames,
  gameId,
  onNicknameChange,
  stream,
  partyStreams,
  onStreamStart,
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
          onStream={onStreamStart}
        />
        {Object.entries(partyNicknames).map(([id, partyNickname]) => (
          <Nickname nickname={partyNickname} key={id} />
        ))}
        {(stream || Object.keys(partyStreams).length !== 0) && (
          <Text>Streams</Text>
        )}
        {stream && <Stream stream={stream} muted />}
        {partyStreams &&
          Object.entries(partyStreams).map(([id, partyStream]) => (
            <Stream stream={partyStream} key={id} />
          ))}
      </Box>
      <Box>
        <AddPartyMemberButton gameId={gameId} />
      </Box>
    </Flex>
  );
}

export default Party;

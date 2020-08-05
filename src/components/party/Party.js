import React from "react";
import { Flex, Box, Text } from "theme-ui";

import AddPartyMemberButton from "./AddPartyMemberButton";
import Nickname from "./Nickname";
import ChangeNicknameButton from "./ChangeNicknameButton";
import StartStreamButton from "./StartStreamButton";
import SettingsButton from "../SettingsButton";
import StartTimerButton from "./StartTimerButton";
import Timer from "./Timer";

function Party({
  nickname,
  partyNicknames,
  gameId,
  onNicknameChange,
  stream,
  partyStreams,
  onStreamStart,
  onStreamEnd,
  timer,
  partyTimers,
  onTimerStart,
  onTimerStop,
}) {
  return (
    <Flex
      p={3}
      bg="background"
      sx={{
        flexDirection: "column",
        width: "112px",
        minWidth: "112px",
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
        <Nickname nickname={`${nickname} (you)` || ""} />
        {Object.entries(partyNicknames).map(([id, partyNickname]) => (
          <Nickname
            nickname={partyNickname}
            key={id}
            stream={partyStreams[id]}
          />
        ))}
        {timer && <Timer timer={timer} index={0} />}
        {Object.entries(partyTimers).map(([id, partyTimer], index) => (
          <Timer
            timer={partyTimer}
            key={id}
            // Put party timers above your timer if there is one
            index={timer ? index + 1 : index}
          />
        ))}
      </Box>
      <Flex sx={{ flexDirection: "column" }}>
        <ChangeNicknameButton nickname={nickname} onChange={onNicknameChange} />
        <AddPartyMemberButton gameId={gameId} />
        <StartStreamButton
          onStreamStart={onStreamStart}
          onStreamEnd={onStreamEnd}
          stream={stream}
        />
        <StartTimerButton
          onTimerStart={onTimerStart}
          onTimerStop={onTimerStop}
          timer={timer}
        />
        <SettingsButton />
      </Flex>
    </Flex>
  );
}

export default Party;

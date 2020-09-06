import React from "react";
import { Flex, Box, Text } from "theme-ui";
import SimpleBar from "simplebar-react";

import AddPartyMemberButton from "./AddPartyMemberButton";
import Nickname from "./Nickname";
import ChangeNicknameButton from "./ChangeNicknameButton";
import StartStreamButton from "./StartStreamButton";
import SettingsButton from "../SettingsButton";
import StartTimerButton from "./StartTimerButton";
import Timer from "./Timer";
import DiceTrayButton from "./DiceTrayButton";

import useSetting from "../../helpers/useSetting";

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
  shareDice,
  onShareDiceChage,
  diceRolls,
  onDiceRollsChange,
  partyDiceRolls,
}) {
  const [fullScreen] = useSetting("map.fullScreen");

  return (
    <Box
      bg="background"
      sx={{
        position: "relative",
        // width: fullScreen ? "0" : "112px",
        // minWidth: fullScreen ? "0" : "112px",
      }}
    >
      <Box
        sx={{
          flexDirection: "column",
          overflow: "visible",
          alignItems: "center",
          height: "100%",
          display: fullScreen ? "none" : "flex",
          width: "112px",
          minWidth: "112px",
        }}
        p={3}
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
        <SimpleBar
          style={{
            flexGrow: 1,
            width: "100%",
            minWidth: "112px",
            padding: "0 16px",
            height: "calc(100% - 232px)",
          }}
        >
          <Nickname
            nickname={`${nickname} (you)`}
            diceRolls={shareDice && diceRolls}
          />
          {Object.entries(partyNicknames).map(([id, partyNickname]) => (
            <Nickname
              nickname={partyNickname}
              key={id}
              stream={partyStreams[id]}
              diceRolls={partyDiceRolls[id]}
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
        </SimpleBar>
        <Flex sx={{ flexDirection: "column" }}>
          <ChangeNicknameButton
            nickname={nickname}
            onChange={onNicknameChange}
          />
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
      </Box>
      <DiceTrayButton
        shareDice={shareDice}
        onShareDiceChage={onShareDiceChage}
        diceRolls={diceRolls}
        onDiceRollsChange={onDiceRollsChange}
      />
    </Box>
  );
}

export default Party;

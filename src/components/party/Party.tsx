import React, { useEffect } from "react";
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
import {
  PartyState,
  PlayerDice,
  PlayerInfo,
  Timer as PartyTimer,
} from "./PartyState";

import useSetting from "../../hooks/useSetting";

import { useParty } from "../../contexts/PartyContext";
import { usePlayerState, usePlayerUpdater } from "../../contexts/PlayerContext";

function Party({
  gameId,
  stream,
  partyStreams,
  onStreamStart,
  onStreamEnd,
}: {
  gameId: string;
  stream;
  partyStreams;
  onStreamStart;
  onStreamEnd;
}) {
  const setPlayerState = usePlayerUpdater();
  const playerState: PlayerInfo = usePlayerState();
  const partyState: PartyState = useParty();

  const [fullScreen] = useSetting("map.fullScreen");
  const [shareDice, setShareDice] = useSetting("dice.shareDice");

  function handleTimerStart(newTimer: PartyTimer) {
    setPlayerState((prevState) => ({ ...prevState, timer: newTimer }));
  }

  function handleTimerStop() {
    setPlayerState((prevState) => ({ ...prevState, timer: null }));
  }

  useEffect(() => {
    let prevTime = performance.now();
    let request = requestAnimationFrame(update);
    let counter = 0;
    function update(time) {
      request = requestAnimationFrame(update);
      const deltaTime = time - prevTime;
      prevTime = time;

      if (playerState.timer) {
        counter += deltaTime;
        // Update timer every second
        if (counter > 1000) {
          const newTimer: PartyTimer = {
            ...playerState.timer,
            current: playerState.timer.current - counter,
          };
          if (newTimer.current < 0) {
            setPlayerState((prevState) => ({ ...prevState, timer: null }));
          } else {
            setPlayerState((prevState) => ({ ...prevState, timer: newTimer }));
          }
          counter = 0;
        }
      }
    }
    return () => {
      cancelAnimationFrame(request);
    };
  }, [playerState.timer, setPlayerState]);

  function handleNicknameChange(newNickname: string) {
    setPlayerState((prevState) => ({ ...prevState, nickname: newNickname }));
  }

  function handleDiceRollsChange(newDiceRolls: number[]) {
    setPlayerState(
      (prevState: PlayerDice) => ({
        ...prevState,
        dice: { share: shareDice, rolls: newDiceRolls },
      }),
      shareDice
    );
  }

  function handleShareDiceChange(newShareDice: boolean) {
    setShareDice(newShareDice);
    setPlayerState((prevState: PlayerInfo) => ({
      ...prevState,
      dice: { ...prevState.dice, share: newShareDice },
    }));
  }

  return (
    <Box
      bg="background"
      sx={{
        position: "relative",
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
          {/* TODO: check if stream is required here */}
          <Nickname
            nickname={`${playerState.nickname} (you)`}
            diceRolls={shareDice && playerState.dice.rolls}
          />
          {Object.entries(partyState).map(([id, { nickname, dice }]) => (
            <Nickname
              nickname={nickname}
              key={id}
              stream={partyStreams[id]}
              diceRolls={dice.share && dice.rolls}
            />
          ))}
          {playerState.timer && <Timer timer={playerState.timer} index={0} />}
          {Object.entries(partyState)
            .filter(([_, { timer }]) => timer)
            .map(([id, { timer }], index) => (
              <Timer
                timer={timer}
                key={id}
                // Put party timers above your timer if there is one
                index={playerState.timer ? index + 1 : index}
              />
            ))}
        </SimpleBar>
        <Flex sx={{ flexDirection: "column" }}>
          <ChangeNicknameButton
            nickname={playerState.nickname}
            onChange={handleNicknameChange}
          />
          <AddPartyMemberButton gameId={gameId} />
          <StartStreamButton
            onStreamStart={onStreamStart}
            onStreamEnd={onStreamEnd}
            stream={stream}
          />
          <StartTimerButton
            onTimerStart={handleTimerStart}
            onTimerStop={handleTimerStop}
            timer={playerState.timer}
          />
          <SettingsButton />
        </Flex>
      </Box>
      <DiceTrayButton
        shareDice={shareDice}
        onShareDiceChange={handleShareDiceChange}
        diceRolls={(playerState.dice && playerState.dice.rolls) || []}
        onDiceRollsChange={handleDiceRollsChange}
      />
    </Box>
  );
}

export default Party;

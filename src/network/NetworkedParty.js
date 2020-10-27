import React, { useContext, useState, useEffect, useCallback } from "react";
import { useToasts } from "react-toast-notifications";

// Load session for auto complete
// eslint-disable-next-line no-unused-vars
import Session from "./Session";
import { isStreamStopped, omit, fromEntries } from "../helpers/shared";

import AuthContext from "../contexts/AuthContext";
import useSetting from "../helpers/useSetting";

import Party from "../components/party/Party";

/**
 * @typedef {object} NetworkedPartyProps
 * @property {string} gameId
 * @property {Session} session
 */

/**
 * @param {NetworkedPartyProps} props
 */
function NetworkedParty({ gameId, session }) {
  const { nickname, setNickname } = useContext(AuthContext);
  const [partyNicknames, setPartyNicknames] = useState({});
  const [stream, setStream] = useState(null);
  const [partyStreams, setPartyStreams] = useState({});
  const [timer, setTimer] = useState(null);
  const [partyTimers, setPartyTimers] = useState({});
  const [diceRolls, setDiceRolls] = useState([]);
  const [partyDiceRolls, setPartyDiceRolls] = useState({});

  const { addToast } = useToasts();

  const [shareDice, setShareDice] = useSetting("dice.shareDice");

  function handleNicknameChange(newNickname) {
    setNickname(newNickname);
    session.send("nickname", { [session.id]: newNickname });
  }

  function handleStreamStart(localStream) {
    setStream(localStream);
    const tracks = localStream.getTracks();
    for (let track of tracks) {
      // Only add the audio track of the stream to the remote peer
      if (track.kind === "audio") {
        for (let peer of Object.values(session.peers)) {
          peer.connection.addTrack(track, localStream);
        }
      }
    }
  }

  const handleStreamEnd = useCallback(
    (localStream) => {
      setStream(null);
      const tracks = localStream.getTracks();
      for (let track of tracks) {
        track.stop();
        // Only sending audio so only remove the audio track
        if (track.kind === "audio") {
          for (let peer of Object.values(session.peers)) {
            peer.connection.removeTrack(track, localStream);
          }
        }
      }
    },
    [session]
  );

  function handleTimerStart(newTimer) {
    setTimer(newTimer);
    session.send("timer", { [session.id]: newTimer });
  }

  function handleTimerStop() {
    setTimer(null);
    session.send("timer", { [session.id]: null });
  }

  useEffect(() => {
    let prevTime = performance.now();
    let request = requestAnimationFrame(update);
    let counter = 0;
    function update(time) {
      request = requestAnimationFrame(update);
      const deltaTime = time - prevTime;
      prevTime = time;

      if (timer) {
        counter += deltaTime;
        // Update timer every second
        if (counter > 1000) {
          const newTimer = {
            ...timer,
            current: timer.current - counter,
          };
          if (newTimer.current < 0) {
            setTimer(null);
            session.send("timer", { [session.id]: null });
          } else {
            setTimer(newTimer);
            session.send("timer", { [session.id]: newTimer });
          }
          counter = 0;
        }
      }
    }
    return () => {
      cancelAnimationFrame(request);
    };
  }, [timer, session]);

  function handleDiceRollsChange(newDiceRolls) {
    setDiceRolls(newDiceRolls);
    if (shareDice) {
      session.send("dice", { [session.id]: newDiceRolls });
    }
  }

  function handleShareDiceChange(newShareDice) {
    setShareDice(newShareDice);
    if (newShareDice) {
      session.send("dice", { [session.id]: diceRolls });
    } else {
      session.send("dice", { [session.id]: null });
    }
  }

  useEffect(() => {
    function handlePeerConnect({ peer, reply }) {
      reply("nickname", { [session.id]: nickname });
      if (stream) {
        peer.connection.addStream(stream);
      }
      if (timer) {
        reply("timer", { [session.id]: timer });
      }
      if (shareDice) {
        reply("dice", { [session.id]: diceRolls });
      }
    }

    function handlePeerDisconnect({ peer }) {
      if (partyNicknames[peer.id]) {
        addToast(`${partyNicknames[peer.id]} Left the Party`);
      }
      setPartyNicknames((prevNicknames) => omit(prevNicknames, [peer.id]));
      setPartyTimers((prevTimers) => omit(prevTimers, [peer.id]));
    }

    function handlePeerData({ id, data, peer }) {
      if (id === "nickname") {
        if (!peer.initiator) {
          for (let peerId in data) {
            if (!(peerId in partyNicknames)) {
              addToast(`${data[peerId]} Joined the Party`);
            }
          }
        }
        setPartyNicknames((prevNicknames) => ({
          ...prevNicknames,
          ...data,
        }));
      }
      if (id === "timer") {
        setPartyTimers((prevTimers) => {
          const newTimers = { ...prevTimers, ...data };
          // filter out timers that are null
          const filtered = Object.entries(newTimers).filter(
            ([, value]) => value !== null
          );
          return fromEntries(filtered);
        });
      }
      if (id === "dice") {
        setPartyDiceRolls((prevDiceRolls) => {
          const newRolls = { ...prevDiceRolls, ...data };
          // filter out dice rolls that are null
          const filtered = Object.entries(newRolls).filter(
            ([, value]) => value !== null
          );
          return fromEntries(filtered);
        });
      }
    }

    function handlePeerTrackAdded({ peer, stream: remoteStream }) {
      setPartyStreams((prevStreams) => ({
        ...prevStreams,
        [peer.id]: remoteStream,
      }));
    }

    function handlePeerTrackRemoved({ peer, stream: remoteStream }) {
      if (isStreamStopped(remoteStream)) {
        setPartyStreams((prevStreams) => omit(prevStreams, [peer.id]));
      } else {
        setPartyStreams((prevStreams) => ({
          ...prevStreams,
          [peer.id]: remoteStream,
        }));
      }
    }

    session.on("connect", handlePeerConnect);
    session.on("disconnect", handlePeerDisconnect);
    session.on("data", handlePeerData);
    session.on("trackAdded", handlePeerTrackAdded);
    session.on("trackRemoved", handlePeerTrackRemoved);

    return () => {
      session.off("connect", handlePeerConnect);
      session.off("disconnect", handlePeerDisconnect);
      session.off("data", handlePeerData);
      session.off("trackAdded", handlePeerTrackAdded);
      session.off("trackRemoved", handlePeerTrackRemoved);
    };
  }, [
    session,
    nickname,
    stream,
    timer,
    shareDice,
    diceRolls,
    partyNicknames,
    addToast,
  ]);

  useEffect(() => {
    if (stream) {
      const tracks = stream.getTracks();
      // Detect when someone has ended the screen sharing
      // by looking at the streams video track onended
      // the audio track doesn't seem to trigger this event
      for (let track of tracks) {
        if (track.kind === "video") {
          track.onended = function () {
            handleStreamEnd(stream);
          };
        }
      }
    }
  }, [stream, handleStreamEnd]);

  return (
    <>
      <Party
        gameId={gameId}
        onNicknameChange={handleNicknameChange}
        onStreamStart={handleStreamStart}
        onStreamEnd={handleStreamEnd}
        nickname={nickname}
        partyNicknames={partyNicknames}
        stream={stream}
        partyStreams={partyStreams}
        timer={timer}
        partyTimers={partyTimers}
        onTimerStart={handleTimerStart}
        onTimerStop={handleTimerStop}
        shareDice={shareDice}
        onShareDiceChage={handleShareDiceChange}
        diceRolls={diceRolls}
        onDiceRollsChange={handleDiceRollsChange}
        partyDiceRolls={partyDiceRolls}
      />
    </>
  );
}

export default NetworkedParty;

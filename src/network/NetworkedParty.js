import React, { useContext, useState, useEffect, useCallback } from "react";

// Load session for auto complete
// eslint-disable-next-line no-unused-vars
import Session from "../helpers/Session";
import { isStreamStopped, omit } from "../helpers/shared";

import AuthContext from "../contexts/AuthContext";

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
    function decreaseTimer(previousTimer) {
      if (previousTimer.second > 0) {
        return { ...previousTimer, second: previousTimer.second - 1 };
      } else if (previousTimer.minute > 0) {
        return {
          ...previousTimer,
          minute: previousTimer.minute - 1,
          second: 59,
        };
      } else if (previousTimer.hour > 0) {
        return { hour: previousTimer.hour - 1, minute: 59, second: 59 };
      } else return { hour: 0, minute: 0, second: 0 };
    }
    function updateTimers() {
      if (timer) {
        const newTimer = decreaseTimer(timer);
        setTimer(newTimer);
        session.send("timer", { [session.id]: newTimer });
      }
    }
    const interval = setInterval(updateTimers, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [timer, session]);

  useEffect(() => {
    function handlePeerConnect({ peer, reply }) {
      reply("nickname", { [session.id]: nickname });
      if (stream) {
        peer.connection.addStream(stream);
      }
      if (timer) {
        reply("timer", { [session.id]: timer });
      }
    }

    function handlePeerDisconnect({ peer }) {
      setPartyNicknames((prevNicknames) => omit(prevNicknames, [peer.id]));
      setPartyTimers((prevTimers) => omit(prevTimers, [peer.id]));
    }

    function handlePeerData({ id, data }) {
      if (id === "nickname") {
        setPartyNicknames((prevNicknames) => ({
          ...prevNicknames,
          ...data,
        }));
      }
      if (id === "timer") {
        setPartyTimers((prevTimers) => ({
          ...prevTimers,
          ...data,
        }));
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
  }, [session, nickname, stream, timer]);

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
    />
  );
}

export default NetworkedParty;

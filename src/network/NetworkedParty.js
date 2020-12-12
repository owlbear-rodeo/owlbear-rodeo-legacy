import React, { useContext, useState, useEffect, useCallback } from "react";

// Load session for auto complete
// eslint-disable-next-line no-unused-vars
import Session from "./Session";
import { isStreamStopped, omit } from "../helpers/shared";

import PlayerContext from "../contexts/PlayerContext";

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
  const { partyState } = useContext(PlayerContext);
  const [stream, setStream] = useState(null);
  const [partyStreams, setPartyStreams] = useState({});

  function handleStreamStart(localStream) {
    setStream(localStream);
    const tracks = localStream.getTracks();
    for (let track of tracks) {
      // Only add the audio track of the stream to the remote peer
      if (track.kind === "audio") {
        for (let player of Object.values(partyState)) {
          session.startStreamTo(player.sessionId, track, localStream);
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
          for (let player of Object.values(partyState)) {
            session.endStreamTo(player.sessionId, track, localStream);
          }
        }
      }
    },
    [session, partyState]
  );

  useEffect(() => {
    function handlePlayerJoined(sessionId) {
      if (stream) {
        const tracks = stream.getTracks();
        for (let track of tracks) {
          if (track.kind === "audio") {
            session.startStreamTo(sessionId, track, stream);
          }
        }
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

    session.on("playerJoined", handlePlayerJoined);
    session.on("peerTrackAdded", handlePeerTrackAdded);
    session.on("peerTrackRemoved", handlePeerTrackRemoved);

    return () => {
      session.off("playerJoined", handlePlayerJoined);
      session.off("peerTrackAdded", handlePeerTrackAdded);
      session.off("peerTrackRemoved", handlePeerTrackRemoved);
    };
  });

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
        onStreamStart={handleStreamStart}
        onStreamEnd={handleStreamEnd}
        stream={stream}
        partyStreams={partyStreams}
      />
    </>
  );
}

export default NetworkedParty;

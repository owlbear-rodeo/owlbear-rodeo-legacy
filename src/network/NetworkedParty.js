import React, { useContext, useState, useEffect, useCallback } from "react";

// Load session for auto complete
// eslint-disable-next-line no-unused-vars
import Session from "./Session";
import { isStreamStopped, omit } from "../helpers/shared";

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
  const [stream, setStream] = useState(null);
  const [partyStreams, setPartyStreams] = useState({});

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

  useEffect(() => {
    function handlePeerConnect({ peer, reply }) {
      if (stream) {
        peer.connection.addStream(stream);
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
    session.on("trackAdded", handlePeerTrackAdded);
    session.on("trackRemoved", handlePeerTrackRemoved);

    return () => {
      session.off("connect", handlePeerConnect);
      session.off("trackAdded", handlePeerTrackAdded);
      session.off("trackRemoved", handlePeerTrackRemoved);
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

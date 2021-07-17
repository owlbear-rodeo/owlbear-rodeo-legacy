import { useState, useEffect, useCallback, useRef } from "react";
import { useToasts } from "react-toast-notifications";

import Session, { PeerTrackAddedEvent, PeerTrackRemovedEvent } from "./Session";
import { isStreamStopped, omit } from "../helpers/shared";

import { useParty } from "../contexts/PartyContext";

import Party from "../components/party/Party";

/**
 * @typedef {object} NetworkedPartyProps
 * @property {string} gameId
 * @property {Session} session
 */

type NetworkedPartyProps = { gameId: string; session: Session };

/**
 * @param {NetworkedPartyProps} props
 */
function NetworkedParty({ gameId, session }: NetworkedPartyProps) {
  const partyState = useParty();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [partyStreams, setPartyStreams] = useState({});

  const { addToast } = useToasts();

  function handleStreamStart(localStream: MediaStream) {
    setStream(localStream);
    const tracks = localStream.getTracks();
    for (let track of tracks) {
      // Only add the audio track of the stream to the remote peer
      if (track.kind === "audio") {
        for (let player of Object.values(partyState)) {
          if (player.sessionId) {
            session.startStreamTo(player.sessionId, track, localStream);
          }
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
            if (player.sessionId) {
              session.endStreamTo(player.sessionId, track, localStream);
            }
          }
        }
      }
    },
    [session, partyState]
  );

  // Keep a reference to players who have just joined to show the joined notification
  const joinedPlayersRef = useRef<string[]>([]);
  useEffect(() => {
    if (joinedPlayersRef.current.length > 0) {
      for (let id of joinedPlayersRef.current) {
        if (partyState[id]) {
          addToast(`${partyState[id].nickname} joined the party`);
        }
      }
      joinedPlayersRef.current = [];
    }
  }, [partyState, addToast]);

  useEffect(() => {
    function handlePlayerJoined(sessionId: string) {
      if (stream) {
        const tracks = stream.getTracks();
        for (let track of tracks) {
          if (track.kind === "audio") {
            session.startStreamTo(sessionId, track, stream);
          }
        }
      }
      // Add player to join notification list
      // Can't just show the notification here as the partyState data isn't populated at this point
      joinedPlayersRef.current.push(sessionId);
    }

    function handlePlayerLeft(sessionId: string) {
      if (partyState[sessionId]) {
        addToast(`${partyState[sessionId].nickname} left the party`);
      }
    }

    function handlePeerTrackAdded({
      peer,
      stream: remoteStream,
    }: PeerTrackAddedEvent) {
      setPartyStreams((prevStreams) => ({
        ...prevStreams,
        [peer.id]: remoteStream,
      }));
    }

    function handlePeerTrackRemoved({
      peer,
      stream: remoteStream,
    }: PeerTrackRemovedEvent) {
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
    session.on("playerLeft", handlePlayerLeft);
    session.on("peerTrackAdded", handlePeerTrackAdded);
    session.on("peerTrackRemoved", handlePeerTrackRemoved);

    return () => {
      session.off("playerJoined", handlePlayerJoined);
      session.off("playerLeft", handlePlayerLeft);
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

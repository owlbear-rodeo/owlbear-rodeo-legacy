import React, { useState, useRef, useEffect, useCallback } from "react";
import { Flex, Box, Text, Link } from "theme-ui";
import { useParams } from "react-router-dom";

import { omit, isStreamStopped } from "../helpers/shared";

import useSession from "../helpers/useSession";
import { getRandomMonster } from "../helpers/monsters";

import Party from "../components/Party";
import Tokens from "../components/Tokens";
import Map from "../components/Map";
import Banner from "../components/Banner";

function Game() {
  const { id: gameId } = useParams();

  const { peers, socket } = useSession(
    gameId,
    handlePeerConnected,
    handlePeerDisconnected,
    handlePeerData,
    handlePeerTrackAdded,
    handlePeerTrackRemoved,
    handlePeerError
  );

  const [mapSource, setMapSource] = useState(null);
  const mapDataRef = useRef(null);

  function handleMapChanged(mapData, mapSource) {
    mapDataRef.current = mapData;
    setMapSource(mapSource);
    for (let peer of Object.values(peers)) {
      peer.send({ id: "map", data: mapDataRef.current });
    }
  }

  const [mapTokens, setMapTokens] = useState({});

  function handleEditMapToken(token) {
    if (!mapSource) {
      return;
    }
    setMapTokens((prevMapTokens) => ({
      ...prevMapTokens,
      [token.id]: token,
    }));
    for (let peer of Object.values(peers)) {
      const data = { [token.id]: token };
      peer.send({ id: "tokenEdit", data });
    }
  }

  function handleRemoveMapToken(token) {
    setMapTokens((prevMapTokens) => {
      const { [token.id]: old, ...rest } = prevMapTokens;
      return rest;
    });
    for (let peer of Object.values(peers)) {
      const data = { [token.id]: token };
      peer.send({ id: "tokenRemove", data });
    }
  }

  const [nickname, setNickname] = useState(getRandomMonster());
  const [partyNicknames, setPartyNicknames] = useState({});

  function handleNicknameChange(nickname) {
    setNickname(nickname);
    for (let peer of Object.values(peers)) {
      const data = { [socket.id]: nickname };
      peer.send({ id: "nickname", data });
    }
  }

  const [stream, setStream] = useState(null);
  const [partyStreams, setPartyStreams] = useState({});
  function handlePeerConnected({ peer }) {
    peer.send({ id: "nickname", data: { [socket.id]: nickname } });
    if (stream) {
      peer.addStream(stream);
    }
  }

  function handlePeerData({ data, peer }) {
    if (data.id === "sync") {
      if (mapSource) {
        peer.send({ id: "map", data: mapDataRef.current });
      }
      if (mapTokens) {
        peer.send({ id: "tokenEdit", data: mapTokens });
      }
    }
    if (data.id === "map") {
      const blob = new Blob([data.data.file]);
      mapDataRef.current = { ...data.data, file: blob };
      setMapSource(URL.createObjectURL(mapDataRef.current.file));
    }
    if (data.id === "tokenEdit") {
      setMapTokens((prevMapTokens) => ({
        ...prevMapTokens,
        ...data.data,
      }));
    }
    if (data.id === "tokenRemove") {
      setMapTokens((prevMapTokens) =>
        omit(prevMapTokens, Object.keys(data.data))
      );
    }
    if (data.id === "nickname") {
      setPartyNicknames((prevNicknames) => ({
        ...prevNicknames,
        ...data.data,
      }));
    }
  }

  function handlePeerDisconnected(disconnectedId) {
    setPartyNicknames((prevNicknames) => omit(prevNicknames, [disconnectedId]));
  }

  const [peerError, setPeerError] = useState(null);
  function handlePeerError(error) {
    setPeerError(error.message || "Unknown Error Occurred.");
  }

  function handlePeerTrackAdded({ id, stream: remoteStream }) {
    setPartyStreams((prevStreams) => ({
      ...prevStreams,
      [id]: remoteStream,
    }));
  }

  function handlePeerTrackRemoved({ id, stream: remoteStream }) {
    if (isStreamStopped(remoteStream)) {
      setPartyStreams((prevStreams) => omit(prevStreams, [id]));
    } else {
      setPartyStreams((prevStreams) => ({
        ...prevStreams,
        [id]: remoteStream,
      }));
    }
  }

  function handleStreamStart(localStream) {
    setStream(localStream);
    const tracks = localStream.getTracks();
    for (let track of tracks) {
      // Only add the audio track of the stream to the remote peer
      if (track.kind === "audio") {
        for (let peer of Object.values(peers)) {
          peer.addTrack(track, localStream);
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
          for (let peer of Object.values(peers)) {
            peer.removeTrack(track, localStream);
          }
        }
      }
    },
    [peers]
  );

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
  }, [stream, peers, handleStreamEnd]);

  return (
    <>
      <Flex sx={{ flexDirection: "column", height: "100%" }}>
        <Flex
          sx={{ justifyContent: "space-between", flexGrow: 1, height: "100%" }}
        >
          <Party
            nickname={nickname}
            partyNicknames={partyNicknames}
            gameId={gameId}
            onNicknameChange={handleNicknameChange}
            stream={stream}
            partyStreams={partyStreams}
            onStreamStart={handleStreamStart}
            onStreamEnd={handleStreamEnd}
          />
          <Map
            mapSource={mapSource}
            mapData={mapDataRef.current}
            tokens={mapTokens}
            onMapTokenMove={handleEditMapToken}
            onMapTokenRemove={handleRemoveMapToken}
            onMapChanged={handleMapChanged}
          />
          <Tokens onCreateMapToken={handleEditMapToken} />
        </Flex>
      </Flex>
      <Banner isOpen={!!peerError} onRequestClose={() => setPeerError(null)}>
        <Box p={1}>
          <Text as="p" variant="body2">
            {peerError} See <Link href="#/faq">FAQ</Link> for more information.
          </Text>
        </Box>
      </Banner>
    </>
  );
}

export default Game;

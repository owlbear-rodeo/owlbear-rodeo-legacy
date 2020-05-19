import React, { useState, useEffect, useCallback, useContext } from "react";
import { Flex, Box, Text } from "theme-ui";
import { useParams } from "react-router-dom";

import { omit, isStreamStopped } from "../helpers/shared";
import useSession from "../helpers/useSession";
import useDebounce from "../helpers/useDebounce";

import Party from "../components/party/Party";
import Tokens from "../components/token/Tokens";
import Map from "../components/map/Map";
import Banner from "../components/Banner";
import LoadingOverlay from "../components/LoadingOverlay";
import Link from "../components/Link";

import AuthModal from "../modals/AuthModal";

import AuthContext from "../contexts/AuthContext";
import DatabaseContext from "../contexts/DatabaseContext";
import TokenDataContext from "../contexts/TokenDataContext";
import MapDataContext from "../contexts/MapDataContext";

function Game() {
  const { id: gameId } = useParams();
  const { authenticationStatus, userId, nickname, setNickname } = useContext(
    AuthContext
  );

  const { peers, socket } = useSession(
    gameId,
    handlePeerConnected,
    handlePeerDisconnected,
    handlePeerData,
    handlePeerTrackAdded,
    handlePeerTrackRemoved,
    handlePeerError
  );

  /**
   * Map state
   */

  const [currentMap, setCurrentMap] = useState(null);
  const [currentMapState, setCurrentMapState] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  const canEditMapDrawing =
    currentMap !== null &&
    currentMapState !== null &&
    (currentMapState.editFlags.includes("drawing") ||
      currentMap.owner === userId);

  const canEditFogDrawing =
    currentMap !== null &&
    currentMapState !== null &&
    (currentMapState.editFlags.includes("fog") || currentMap.owner === userId);

  const disabledMapTokens = {};
  // If we have a map and state and have the token permission disabled
  // and are not the map owner
  if (
    currentMapState !== null &&
    currentMap !== null &&
    !currentMapState.editFlags.includes("tokens") &&
    currentMap.owner !== userId
  ) {
    for (let token of Object.values(currentMapState.tokens)) {
      if (token.owner !== userId) {
        disabledMapTokens[token.id] = true;
      }
    }
  }

  const { database } = useContext(DatabaseContext);
  // Sync the map state to the database after 500ms of inactivity
  const debouncedMapState = useDebounce(currentMapState, 500);
  useEffect(() => {
    if (
      debouncedMapState &&
      debouncedMapState.mapId &&
      currentMap &&
      currentMap.owner === userId &&
      database
    ) {
      // Update the database directly to avoid re-renders
      database
        .table("states")
        .update(debouncedMapState.mapId, debouncedMapState);
    }
  }, [currentMap, debouncedMapState, userId, database]);

  function handleMapChange(newMap, newMapState) {
    setCurrentMapState(newMapState);
    setCurrentMap(newMap);
    for (let peer of Object.values(peers)) {
      // Clear the map so the new map state isn't shown on an old map
      peer.connection.send({ id: "map", data: null });
      peer.connection.send({ id: "mapState", data: newMapState });
      sendMapDataToPeer(peer, newMap);
      sendTokensToPeer(peer, newMapState);
    }
  }

  function sendMapDataToPeer(peer, mapData) {
    // Omit file from map change, receiver will request the file if
    // they have an outdated version
    if (mapData.type === "file") {
      const { file, ...rest } = mapData;
      peer.connection.send({ id: "map", data: rest });
    } else {
      peer.connection.send({ id: "map", data: mapData });
    }
  }

  function handleMapStateChange(newMapState) {
    setCurrentMapState(newMapState);
    for (let peer of Object.values(peers)) {
      peer.connection.send({ id: "mapState", data: newMapState });
    }
  }

  function addMapDrawActions(actions, indexKey, actionsKey) {
    setCurrentMapState((prevMapState) => {
      const newActions = [
        ...prevMapState[actionsKey].slice(0, prevMapState[indexKey] + 1),
        ...actions,
      ];
      const newIndex = newActions.length - 1;
      return {
        ...prevMapState,
        [actionsKey]: newActions,
        [indexKey]: newIndex,
      };
    });
  }

  function updateDrawActionIndex(change, indexKey, actionsKey, peerId) {
    const newIndex = Math.min(
      Math.max(currentMapState[indexKey] + change, -1),
      currentMapState[actionsKey].length - 1
    );

    setCurrentMapState((prevMapState) => ({
      ...prevMapState,
      [indexKey]: newIndex,
    }));
    return newIndex;
  }

  function handleMapDraw(action) {
    addMapDrawActions([action], "mapDrawActionIndex", "mapDrawActions");
    for (let peer of Object.values(peers)) {
      peer.connection.send({ id: "mapDraw", data: [action] });
    }
  }

  function handleMapDrawUndo() {
    const index = updateDrawActionIndex(
      -1,
      "mapDrawActionIndex",
      "mapDrawActions"
    );
    for (let peer of Object.values(peers)) {
      peer.connection.send({ id: "mapDrawIndex", data: index });
    }
  }

  function handleMapDrawRedo() {
    const index = updateDrawActionIndex(
      1,
      "mapDrawActionIndex",
      "mapDrawActions"
    );
    for (let peer of Object.values(peers)) {
      peer.connection.send({ id: "mapDrawIndex", data: index });
    }
  }

  function handleFogDraw(action) {
    addMapDrawActions([action], "fogDrawActionIndex", "fogDrawActions");
    for (let peer of Object.values(peers)) {
      peer.connection.send({ id: "mapFog", data: [action] });
    }
  }

  function handleFogDrawUndo() {
    const index = updateDrawActionIndex(
      -1,
      "fogDrawActionIndex",
      "fogDrawActions"
    );
    for (let peer of Object.values(peers)) {
      peer.connection.send({ id: "fogDrawIndex", data: index });
    }
  }

  function handleFogDrawRedo() {
    const index = updateDrawActionIndex(
      1,
      "fogDrawActionIndex",
      "fogDrawActions"
    );
    for (let peer of Object.values(peers)) {
      peer.connection.send({ id: "fogDrawIndex", data: index });
    }
  }

  /**
   * Token state
   */

  // Get all tokens from a token state and send it to a peer
  function sendTokensToPeer(peer, state) {
    let sentTokens = {};
    for (let tokenState of Object.values(state.tokens)) {
      if (
        tokenState.tokenType === "file" &&
        !(tokenState.tokenId in sentTokens)
      ) {
        sentTokens[tokenState.tokenId] = true;
        const token = getToken(tokenState.tokenId);
        // Omit file from token peer will request file if needed
        const { file, ...rest } = token;
        peer.connection.send({ id: "token", data: rest });
      }
    }
  }

  async function handleMapTokenStateCreate(tokenState) {
    // If file type token send the token to the other peers
    if (tokenState.tokenType === "file") {
      const token = getToken(tokenState.tokenId);
      const { file, ...rest } = token;
      for (let peer of Object.values(peers)) {
        peer.connection.send({ id: "token", data: rest });
      }
    }
    handleMapTokenStateChange(tokenState);
  }

  function handleMapTokenStateChange(tokenState) {
    if (currentMapState === null) {
      return;
    }
    setCurrentMapState((prevMapState) => ({
      ...prevMapState,
      tokens: {
        ...prevMapState.tokens,
        [tokenState.id]: tokenState,
      },
    }));
    for (let peer of Object.values(peers)) {
      const data = { [tokenState.id]: tokenState };
      peer.connection.send({ id: "tokenStateEdit", data });
    }
  }

  function handleMapTokenStateRemove(tokenState) {
    setCurrentMapState((prevMapState) => {
      const { [tokenState.id]: old, ...rest } = prevMapState.tokens;
      return { ...prevMapState, tokens: rest };
    });
    for (let peer of Object.values(peers)) {
      const data = { [tokenState.id]: tokenState };
      peer.connection.send({ id: "tokenStateRemove", data });
    }
  }

  /**
   * Party state
   */

  const [partyNicknames, setPartyNicknames] = useState({});

  function handleNicknameChange(nickname) {
    setNickname(nickname);
    for (let peer of Object.values(peers)) {
      const data = { [socket.id]: nickname };
      peer.connection.send({ id: "nickname", data });
    }
  }

  const [stream, setStream] = useState(null);
  const [partyStreams, setPartyStreams] = useState({});
  function handlePeerConnected(peer) {
    peer.connection.send({ id: "nickname", data: { [socket.id]: nickname } });
    if (stream) {
      peer.connection.addStream(stream);
    }
  }

  /**
   * Peer handlers
   */

  const { putToken, getToken } = useContext(TokenDataContext);
  const { putMap, getMap } = useContext(MapDataContext);

  function handlePeerData({ data, peer }) {
    if (data.id === "sync") {
      if (currentMapState) {
        peer.connection.send({ id: "mapState", data: currentMapState });
        sendTokensToPeer(peer, currentMapState);
      }
      if (currentMap) {
        sendMapDataToPeer(peer, currentMap);
      }
    }
    if (data.id === "map") {
      const newMap = data.data;
      // If is a file map check cache and request the full file if outdated
      if (newMap && newMap.type === "file") {
        const cachedMap = getMap(newMap.id);
        if (cachedMap && cachedMap.lastModified === newMap.lastModified) {
          setCurrentMap(cachedMap);
        } else {
          setMapLoading(true);
          peer.connection.send({ id: "mapRequest", data: newMap.id });
        }
      } else {
        setCurrentMap(newMap);
      }
    }
    // Send full map data including file
    if (data.id === "mapRequest") {
      const map = getMap(data.data);
      peer.connection.send({ id: "mapResponse", data: map });
    }
    // A new map response with a file attached
    if (data.id === "mapResponse") {
      setMapLoading(false);
      if (data.data && data.data.type === "file") {
        const newMap = { ...data.data, file: data.data.file };
        putMap(newMap).then(() => {
          setCurrentMap(newMap);
        });
      } else {
        setCurrentMap(data.data);
      }
    }
    if (data.id === "mapState") {
      setCurrentMapState(data.data);
    }
    if (data.id === "token") {
      const newToken = data.data;
      if (newToken && newToken.type === "file") {
        const cachedToken = getToken(newToken.id);
        if (
          !cachedToken ||
          cachedToken.lastModified !== newToken.lastModified
        ) {
          setMapLoading(true);
          peer.connection.send({
            id: "tokenRequest",
            data: newToken.id,
          });
        }
      }
    }
    if (data.id === "tokenRequest") {
      const token = getToken(data.data);
      peer.connection.send({ id: "tokenResponse", data: token });
    }
    if (data.id === "tokenResponse") {
      setMapLoading(false);
      const newToken = data.data;
      if (newToken && newToken.type === "file") {
        putToken(newToken);
      }
    }
    if (data.id === "tokenStateEdit") {
      setCurrentMapState((prevMapState) => ({
        ...prevMapState,
        tokens: { ...prevMapState.tokens, ...data.data },
      }));
    }
    if (data.id === "tokenStateRemove") {
      setCurrentMapState((prevMapState) => ({
        ...prevMapState,
        tokens: omit(prevMapState.tokens, Object.keys(data.data)),
      }));
    }
    if (data.id === "nickname") {
      setPartyNicknames((prevNicknames) => ({
        ...prevNicknames,
        ...data.data,
      }));
    }
    if (data.id === "mapDraw") {
      addMapDrawActions(data.data, "mapDrawActionIndex", "mapDrawActions");
    }
    if (data.id === "mapDrawIndex") {
      setCurrentMapState((prevMapState) => ({
        ...prevMapState,
        mapDrawActionIndex: data.data,
      }));
    }
    if (data.id === "mapFog") {
      addMapDrawActions(data.data, "fogDrawActionIndex", "fogDrawActions");
    }
    if (data.id === "mapFogIndex") {
      setCurrentMapState((prevMapState) => ({
        ...prevMapState,
        fogDrawActionIndex: data.data,
      }));
    }
  }

  function handlePeerDisconnected(peer) {
    setPartyNicknames((prevNicknames) => omit(prevNicknames, [peer.id]));
  }

  const [peerError, setPeerError] = useState(null);
  function handlePeerError({ error, peer }) {
    console.error(error.code);
    if (
      error.code === "ERR_ICE_CONNECTION_FAILURE" ||
      error.code === "ERR_CONNECTION_FAILURE"
    ) {
      setPeerError(
        `${
          peer.id === socket.id
            ? ""
            : `(${partyNicknames[peer.id] || "Unknown"})`
        } Connection failure`
      );
    }
    if (error.code === "ERR_WEBRTC_SUPPORT") {
      setPeerError("WebRTC not supported");
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

  /**
   * Stream handler
   */

  function handleStreamStart(localStream) {
    setStream(localStream);
    const tracks = localStream.getTracks();
    for (let track of tracks) {
      // Only add the audio track of the stream to the remote peer
      if (track.kind === "audio") {
        for (let peer of Object.values(peers)) {
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
          for (let peer of Object.values(peers)) {
            peer.connection.removeTrack(track, localStream);
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
          sx={{
            justifyContent: "space-between",
            flexGrow: 1,
            height: "100%",
          }}
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
            map={currentMap}
            mapState={currentMapState}
            loading={mapLoading}
            onMapTokenStateChange={handleMapTokenStateChange}
            onMapTokenStateRemove={handleMapTokenStateRemove}
            onMapChange={handleMapChange}
            onMapStateChange={handleMapStateChange}
            onMapDraw={handleMapDraw}
            onMapDrawUndo={handleMapDrawUndo}
            onMapDrawRedo={handleMapDrawRedo}
            onFogDraw={handleFogDraw}
            onFogDrawUndo={handleFogDrawUndo}
            onFogDrawRedo={handleFogDrawRedo}
            allowMapDrawing={canEditMapDrawing}
            allowFogDrawing={canEditFogDrawing}
            disabledTokens={disabledMapTokens}
          />
          <Tokens onMapTokenStateCreate={handleMapTokenStateCreate} />
        </Flex>
      </Flex>
      <Banner isOpen={!!peerError} onRequestClose={() => setPeerError(null)}>
        <Box p={1}>
          <Text as="p" variant="body2">
            {peerError} See <Link to="/faq#connection">FAQ</Link> for more
            information.
          </Text>
        </Box>
      </Banner>
      <AuthModal isOpen={authenticationStatus === "unauthenticated"} />
      {authenticationStatus === "unknown" && <LoadingOverlay />}
    </>
  );
}

export default Game;

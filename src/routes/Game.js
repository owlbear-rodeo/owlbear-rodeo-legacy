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

import { tokens as defaultTokens } from "../tokens";

function Game() {
  const { database } = useContext(DatabaseContext);
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

  const [map, setMap] = useState(null);
  const [mapState, setMapState] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  const canEditMapDrawing =
    map !== null &&
    mapState !== null &&
    (mapState.editFlags.includes("drawing") || map.owner === userId);

  const canEditFogDrawing =
    map !== null &&
    mapState !== null &&
    (mapState.editFlags.includes("fog") || map.owner === userId);

  const disabledMapTokens = {};
  // If we have a map and state and have the token permission disabled
  // and are not the map owner
  if (
    mapState !== null &&
    map !== null &&
    !mapState.editFlags.includes("tokens") &&
    map.owner !== userId
  ) {
    for (let token of Object.values(mapState.tokens)) {
      if (token.owner !== userId) {
        disabledMapTokens[token.id] = true;
      }
    }
  }

  // Sync the map state to the database after 500ms of inactivity
  const debouncedMapState = useDebounce(mapState, 500);
  useEffect(() => {
    if (
      debouncedMapState &&
      debouncedMapState.mapId &&
      map &&
      map.owner === userId &&
      database
    ) {
      database
        .table("states")
        .update(debouncedMapState.mapId, debouncedMapState);
    }
  }, [map, debouncedMapState, userId, database]);

  function handleMapChange(newMap, newMapState) {
    setMapState(newMapState);
    setMap(newMap);
    for (let peer of Object.values(peers)) {
      // Clear the map so the new map state isn't shown on an old map
      peer.connection.send({ id: "map", data: null });
      peer.connection.send({ id: "mapState", data: newMapState });
      sendMapDataToPeer(peer, newMap);
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
    setMapState(newMapState);
    for (let peer of Object.values(peers)) {
      peer.connection.send({ id: "mapState", data: newMapState });
    }
  }

  async function handleMapTokenStateChange(token) {
    if (mapState === null) {
      return;
    }
    setMapState((prevMapState) => ({
      ...prevMapState,
      tokens: {
        ...prevMapState.tokens,
        [token.id]: token,
      },
    }));
    for (let peer of Object.values(peers)) {
      const data = { [token.id]: token };
      peer.connection.send({ id: "tokenStateEdit", data });
    }
  }

  function handleMapTokenStateRemove(token) {
    setMapState((prevMapState) => {
      const { [token.id]: old, ...rest } = prevMapState.tokens;
      return { ...prevMapState, tokens: rest };
    });
    for (let peer of Object.values(peers)) {
      const data = { [token.id]: token };
      peer.connection.send({ id: "tokenStateRemove", data });
    }
  }

  function addMapDrawActions(actions, indexKey, actionsKey) {
    setMapState((prevMapState) => {
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
      Math.max(mapState[indexKey] + change, -1),
      mapState[actionsKey].length - 1
    );

    setMapState((prevMapState) => ({
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

  function handlePeerData({ data, peer }) {
    if (data.id === "sync") {
      if (mapState) {
        peer.connection.send({ id: "mapState", data: mapState });
      }
      if (map) {
        sendMapDataToPeer(peer, map);
      }
    }
    if (data.id === "map") {
      const newMap = data.data;
      // If is a file map check cache and request the full file if outdated
      if (newMap && newMap.type === "file") {
        database
          .table("maps")
          .get(newMap.id)
          .then((cachedMap) => {
            if (cachedMap && cachedMap.lastModified === newMap.lastModified) {
              setMap(cachedMap);
            } else {
              setMapLoading(true);
              peer.connection.send({ id: "mapRequest" });
            }
          });
      } else {
        setMap(newMap);
      }
    }
    // Send full map data including file
    if (data.id === "mapRequest") {
      peer.connection.send({ id: "mapResponse", data: map });
    }
    // A new map response with a file attached
    if (data.id === "mapResponse") {
      setMapLoading(false);
      if (data.data && data.data.type === "file") {
        const newMap = { ...data.data, file: data.data.file };
        // Store in db
        database
          .table("maps")
          .put(newMap)
          .then(() => {
            setMap(newMap);
          });
      } else {
        setMap(data.data);
      }
    }
    if (data.id === "mapState") {
      setMapState(data.data);
    }
    if (data.id === "tokenStateEdit") {
      setMapState((prevMapState) => ({
        ...prevMapState,
        tokens: { ...prevMapState.tokens, ...data.data },
      }));
    }
    if (data.id === "tokenStateRemove") {
      setMapState((prevMapState) => ({
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
      setMapState((prevMapState) => ({
        ...prevMapState,
        mapDrawActionIndex: data.data,
      }));
    }
    if (data.id === "mapFog") {
      addMapDrawActions(data.data, "fogDrawActionIndex", "fogDrawActions");
    }
    if (data.id === "mapFogIndex") {
      setMapState((prevMapState) => ({
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

  /**
   * Token data
   */
  const [tokens, setTokens] = useState([]);
  useEffect(() => {
    if (!userId) {
      return;
    }
    const defaultTokensWithIds = [];
    for (let defaultToken of defaultTokens) {
      defaultTokensWithIds.push({
        ...defaultToken,
        id: `__default-${defaultToken.name}`,
        owner: userId,
      });
    }
    setTokens(defaultTokensWithIds);
  }, [userId]);

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
            map={map}
            mapState={mapState}
            tokens={tokens}
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
          <Tokens
            tokens={tokens}
            onCreateMapTokenState={handleMapTokenStateChange}
          />
        </Flex>
      </Flex>
      <Banner isOpen={!!peerError} onRequestClose={() => setPeerError(null)}>
        <Box p={1}>
          <Text as="p" variant="body2">
            {peerError} See <Link to="/faq">FAQ</Link> for more information.
          </Text>
        </Box>
      </Banner>
      <AuthModal isOpen={authenticationStatus === "unauthenticated"} />
      {authenticationStatus === "unknown" && <LoadingOverlay />}
    </>
  );
}

export default Game;

import React, { useState, useRef } from "react";
import { Flex } from "theme-ui";
import { useParams } from "react-router-dom";

import { omit } from "../helpers/shared";

import useSession from "../helpers/useSession";
import { getRandomMonster } from "../helpers/monsters";

import Party from "../components/Party";
import Tokens from "../components/Tokens";
import Map from "../components/Map";

function Game() {
  const { id: gameId } = useParams();

  const { peers, socket } = useSession(
    gameId,
    handlePeerConnected,
    handlePeerDisconnected,
    handlePeerData
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

  function handlePeerConnected({ peer, initiator }) {
    if (!initiator) {
      if (mapSource) {
        peer.send({ id: "map", data: mapDataRef.current });
      }
      peer.send({ id: "tokenEdit", data: mapTokens });
    }
    peer.send({ id: "nickname", data: { [socket.id]: nickname } });
  }

  function handlePeerData({ data }) {
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

  return (
    <Flex sx={{ flexDirection: "column", height: "100%" }}>
      <Flex
        sx={{ justifyContent: "space-between", flexGrow: 1, height: "100%" }}
      >
        <Party
          nickname={nickname}
          partyNicknames={partyNicknames}
          gameId={gameId}
          onNicknameChange={handleNicknameChange}
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
  );
}

export default Game;

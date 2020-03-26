import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback
} from "react";
import { Flex } from "theme-ui";

import { omit } from "../helpers/shared";

import GameContext from "../contexts/GameContext";
import useSession from "../helpers/useSession";
import { getRandomMonster } from "../helpers/monsters";

import Party from "../components/Party";
import Tokens from "../components/Tokens";
import Map from "../components/Map";

function Game() {
  const { gameId } = useContext(GameContext);
  const handleConnectionOpenCallback = useCallback(handleConnectionOpen);
  const handleConnectionSyncCallback = useCallback(handleConnectionSync);
  const { peerId, connections, connectTo } = useSession(
    handleConnectionOpenCallback,
    handleConnectionSyncCallback
  );

  useEffect(() => {
    if (gameId !== null && peerId !== null && !(gameId in connections)) {
      connectTo(gameId);
    }
  }, [gameId, peerId, connectTo, connections]);

  const [mapSource, setMapSource] = useState(null);
  const mapDataRef = useRef(null);

  function handleMapChanged(mapData, mapSource) {
    mapDataRef.current = mapData;
    setMapSource(mapSource);
    for (let connection of Object.values(connections)) {
      connection.send({ id: "map", data: mapDataRef.current });
    }
  }

  const [mapTokens, setMapTokens] = useState({});

  function handleEditMapToken(token) {
    if (!mapSource) {
      return;
    }
    setMapTokens(prevMapTokens => ({
      ...prevMapTokens,
      [token.id]: token
    }));
    for (let connection of Object.values(connections)) {
      const data = { [token.id]: token };
      connection.send({ id: "tokenEdit", data });
    }
  }

  function handleRemoveMapToken(token) {
    setMapTokens(prevMapTokens => {
      const { [token.id]: old, ...rest } = prevMapTokens;
      return rest;
    });
    for (let connection of Object.values(connections)) {
      const data = { [token.id]: token };
      connection.send({ id: "tokenRemove", data });
    }
  }

  const currentNicknameRef = useRef(getRandomMonster());
  const [nicknames, setNicknames] = useState({});
  function handleNicknameChange(nickname) {
    currentNicknameRef.current = nickname;
    setNicknames(prevNicknames => ({
      ...prevNicknames,
      [peerId]: nickname
    }));
    for (let connection of Object.values(connections)) {
      const data = { [peerId]: nickname };
      connection.send({ id: "nickname", data });
    }
  }
  useEffect(() => {
    // If we don't have a nickname generate one when we have a peer
    if (peerId !== null && !(peerId in nicknames)) {
      setNicknames(prevNicknames => ({
        ...prevNicknames,
        [peerId]: currentNicknameRef.current
      }));
    }
  }, [peerId, nicknames, currentNicknameRef]);

  function handleConnectionOpen(connection) {
    connection.on("data", data => {
      if (data.id === "map") {
        const blob = new Blob([data.data.file]);
        mapDataRef.current = { ...data.data, file: blob };
        setMapSource(URL.createObjectURL(mapDataRef.current.file));
      }
      if (data.id === "tokenEdit") {
        setMapTokens(prevMapTokens => ({
          ...prevMapTokens,
          ...data.data
        }));
      }
      if (data.id === "tokenRemove") {
        setMapTokens(prevMapTokens =>
          omit(prevMapTokens, Object.keys(data.data))
        );
      }
      if (data.id === "nickname") {
        setNicknames(prevNicknames => ({
          ...prevNicknames,
          ...data.data
        }));
      }
    });
    connection.on("error", () => {
      setNicknames(prevNicknames => omit(prevNicknames, [connection.peer]));
    });
    connection.send({
      id: "nickname",
      data: { [peerId]: currentNicknameRef.current }
    });
  }

  function handleConnectionSync(connection) {
    if (mapSource) {
      connection.send({ id: "map", data: mapDataRef.current });
    }
    connection.send({ id: "tokenEdit", data: mapTokens });
    connection.send({ id: "nickname", data: nicknames });
  }

  return (
    <Flex sx={{ flexDirection: "column", height: "100%" }}>
      <Flex
        sx={{ justifyContent: "space-between", flexGrow: 1, height: "100%" }}
      >
        <Party
          nicknames={nicknames}
          peerId={peerId}
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

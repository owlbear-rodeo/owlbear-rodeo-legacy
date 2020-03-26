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

  const [messages, setMessages] = useState({});
  function handleMessageSend(message) {
    setMessages(prevMessages => ({
      ...prevMessages,
      [message.id]: message
    }));
    for (let connection of Object.values(connections)) {
      const data = { [message.id]: message };
      connection.send({ id: "message", data });
    }
  }

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
      if (data.id === "message") {
        setMessages(prevMessages => ({
          ...prevMessages,
          ...data.data
        }));
      }
    });
  }

  function handleConnectionSync(connection) {
    if (mapSource) {
      connection.send({ id: "map", data: mapDataRef.current });
    }
    connection.send({ id: "tokenEdit", data: mapTokens });
    connection.send({ id: "message", data: messages });
  }

  return (
    <Flex sx={{ flexDirection: "column", height: "100vh" }}>
      <Flex
        sx={{ justifyContent: "space-between", flexGrow: 1, height: "100%" }}
      >
        <Party
          peerId={peerId}
          messages={messages}
          onMessageSend={handleMessageSend}
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

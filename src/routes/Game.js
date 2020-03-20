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
  const { peerId, connections, connectTo, streams } = useSession(
    handleConnectionOpenCallback,
    handleConnectionSyncCallback
  );

  useEffect(() => {
    if (gameId !== null && peerId !== null && streams[peerId]) {
      connectTo(gameId);
    }
  }, [gameId, peerId, connectTo, streams]);

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
    });
  }

  function handleConnectionSync(connection) {
    if (mapSource) {
      connection.send({ id: "map", data: mapDataRef.current });
    }
    connection.send({ id: "tokenEdit", data: mapTokens });
  }

  const [gameView, setGameView] = useState("social");

  return (
    <Flex sx={{ flexDirection: "column", height: "100vh" }}>
      <Flex
        sx={{ justifyContent: "space-between", flexGrow: 1, height: "100%" }}
      >
        <Party
          streams={streams}
          localStreamId={peerId}
          view={gameView}
          onViewChange={setGameView}
        />
        {gameView === "encounter" && (
          <Map
            mapSource={mapSource}
            mapData={mapDataRef.current}
            tokens={mapTokens}
            onMapTokenMove={handleEditMapToken}
            onMapTokenRemove={handleRemoveMapToken}
            onMapChanged={handleMapChanged}
          />
        )}
        {gameView === "encounter" && (
          <Tokens onCreateMapToken={handleEditMapToken} />
        )}
      </Flex>
      <Flex
        sx={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          transform: "translate(-50%, -50%)"
        }}
      ></Flex>
    </Flex>
  );
}

export default Game;

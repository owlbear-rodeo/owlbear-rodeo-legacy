import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback
} from "react";
import { Box, Flex } from "theme-ui";

import GameContext from "../contexts/GameContext";
import useSession from "../helpers/useSession";

import Party from "../components/Party";
import Tokens from "../components/Tokens";
import Map from "../components/Map";
import AddMapButton from "../components/AddMapButton";

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

  const [imageSource, setImageSource] = useState(null);
  const imageDataRef = useRef(null);

  function handleMapChange(event) {
    imageDataRef.current = event.target.files[0];
    setImageSource(URL.createObjectURL(imageDataRef.current));
    for (let connection of Object.values(connections)) {
      connection.send({ id: "image", data: imageDataRef.current });
    }
  }

  const [mapTokens, setMapTokens] = useState({});

  function handleCreateMapToken(token) {
    setMapTokens(prevMapTokens => ({
      ...prevMapTokens,
      [token.id]: token
    }));
    for (let connection of Object.values(connections)) {
      connection.send({ id: "token", data: token });
    }
  }

  function handleConnectionOpen(connection) {
    connection.on("data", data => {
      if (data.id === "image") {
        const blob = new Blob([data.data]);
        imageDataRef.current = blob;
        setImageSource(URL.createObjectURL(imageDataRef.current));
      }
      if (data.id === "token") {
        const token = data.data;
        setMapTokens(prevMapTokens => ({
          ...prevMapTokens,
          [token.id]: token
        }));
      }
    });
  }

  function handleConnectionSync(connection) {
    if (imageSource) {
      connection.send({ id: "image", data: imageDataRef.current });
    }
    connection.send({ id: "token", data: mapTokens });
  }

  return (
    <Flex sx={{ flexDirection: "column", height: "100vh" }}>
      <Box
        p={2}
        sx={{
          position: "absolute",
          top: "0",
          left: "50%",
          transform: "translateX(-50%)"
        }}
      >
        <AddMapButton handleMapChange={handleMapChange} />
      </Box>
      <Flex
        sx={{ justifyContent: "space-between", flexGrow: 1, height: "100%" }}
      >
        <Party streams={streams} localStreamId={peerId} />
        <Map imageSource={imageSource} tokens={mapTokens} />
        <Tokens onCreateMapToken={handleCreateMapToken} />
      </Flex>
    </Flex>
  );
}

export default Game;

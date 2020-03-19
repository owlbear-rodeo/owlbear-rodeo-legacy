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

import Token from "../components/Token";
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

  function handleConnectionOpen(connection) {
    connection.on("data", data => {
      if (data.id === "image") {
        const blob = new Blob([data.data]);
        imageDataRef.current = blob;
        setImageSource(URL.createObjectURL(imageDataRef.current));
      }
      if (data.id === "token") {
        setTokenPosition(data.data);
      }
    });
  }

  function handleConnectionSync(connection) {
    if (imageSource) {
      connection.send({ id: "image", data: imageDataRef.current });
    }
    connection.send({ id: "token", data: tokenPosition });
  }

  const [tokenPosition, setTokenPosition] = useState({ x: 0, y: 0 });

  function handleTokenDrag(event, data) {
    const position = { x: data.x, y: data.y };
    setTokenPosition(position);
    for (let connection of Object.values(connections)) {
      connection.send({ id: "token", data: position });
    }
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
      <Flex sx={{ justifyContent: "space-between", flexGrow: 1 }}>
        <Party streams={streams} localStreamId={peerId} />
        <Map imageSource={imageSource} />
        <Tokens />
        {/* <Token onDrag={handleTokenDrag} position={tokenPosition} /> */}
      </Flex>
    </Flex>
  );
}

export default Game;

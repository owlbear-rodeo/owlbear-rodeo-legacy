import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback
} from "react";
import { Container, Box, Image, Input, Flex, Heading } from "theme-ui";

import GameContext from "../contexts/GameContext";
import useSession from "../helpers/useSession";

import Token from "../components/Token";
import Party from "../components/Party";

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

  function handleImageChange(event) {
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
    <Container>
      <Flex p={2} sx={{ justifyContent: "space-between" }}>
        <Heading>{peerId ? peerId : "Loading"}</Heading>
        <Box>
          <Input
            id="image"
            name="image"
            onChange={handleImageChange}
            type="file"
            accept="image/*"
          />
        </Box>
      </Flex>
      <Party streams={streams} />
      <Flex sx={{ justifyContent: "center" }}>
        <Image src={imageSource} />
      </Flex>
      <Token onDrag={handleTokenDrag} position={tokenPosition} />
    </Container>
  );
}

export default Game;

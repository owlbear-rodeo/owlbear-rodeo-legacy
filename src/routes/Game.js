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

function Game() {
  const [gameId, setGameId] = useContext(GameContext);
  const handleConnectionOpenCallback = useCallback(handleConnectionOpen);
  const [peer, peerId, connections, connectTo] = useSession(
    handleConnectionOpenCallback
  );

  useEffect(() => {
    if (gameId !== null && peerId !== null) {
      connectTo(gameId);
    }
  }, [gameId, peerId, connectTo]);

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
    if (imageSource) {
      connection.send({ id: "image", data: imageDataRef.current });
    }
    connection.send({ id: "token", data: tokenPosition });
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
        <Heading>
          {peerId ? peerId : "Loading"}
        </Heading>
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
      <Flex sx={{ justifyContent: "center" }}>
        <Image src={imageSource} />
      </Flex>
      <Token onDrag={handleTokenDrag} position={tokenPosition} />
    </Container>
  );
}

export default Game;

import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback
} from "react";
import { A } from "hookrouter";
import { Container, Box, Image, Input, Label } from "theme-ui";

import GameContext from "../contexts/GameContext";
import useSession from "../helpers/useSession";

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
    connection.on("data", data => {
      if (data.id === "image") {
        const blob = new Blob([data.data]);
        imageDataRef.current = blob;
        setImageSource(URL.createObjectURL(imageDataRef.current));
      }
    });
  }

  return (
    <Container>
      <Image src={imageSource} />
      <Box>
        <Label htmlFor="image">Shove an image in me</Label>
        <Input
          my={4}
          id="image"
          name="image"
          onChange={handleImageChange}
          type="file"
          accept="image/*"
        />
      </Box>
      <div>
        {gameId
          ? `You've joined ${gameId}`
          : `You've started a new game: ${peerId}`}
        <A href="/">GO TO HOME</A>GAME!
      </div>
    </Container>
  );
}

export default Game;

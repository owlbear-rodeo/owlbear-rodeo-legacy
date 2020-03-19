import React, { useContext } from "react";
import { navigate } from "hookrouter";
import { Container, Flex, Button } from "theme-ui";

import GameContext from "../contexts/GameContext";

function Home() {
  const { setGameId } = useContext(GameContext);

  function handleStartGame() {
    setGameId(null);
    navigate("/game");
  }

  function handleJoinGame() {
    navigate("/join");
  }

  return (
    <Container p={4} sx={{ maxWidth: "300px" }}>
      <Flex sx={{ flexDirection: "column" }}>
        <Button m={2} onClick={handleStartGame}>
          Start Game
        </Button>
        <Button m={2} onClick={handleJoinGame}>
          Join Game
        </Button>
      </Flex>
    </Container>
  );
}

export default Home;

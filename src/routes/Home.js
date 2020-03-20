import React, { useContext } from "react";
import { navigate } from "hookrouter";
import { Container, Flex, Button, Image, Heading } from "theme-ui";

import GameContext from "../contexts/GameContext";

import owlington from "../images/Owlington.png";

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
    <Container sx={{ maxWidth: "300px" }}>
      <Flex
        sx={{
          flexDirection: "column",
          height: "100vh",
          justifyContent: "center"
        }}
      >
        <Heading sx={{ textAlign: "center", fontSize: "48px" }}>
          Owlbear Rodeo
        </Heading>
        <Image src={owlington} m={2} />
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

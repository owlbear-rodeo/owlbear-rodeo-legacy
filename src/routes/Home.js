import React from "react";
import { navigate } from "hookrouter";
import { Container, Flex, Button, Image, Text } from "theme-ui";
import shortid from "shortid";

import owlington from "../images/Owlington.png";

function Home() {
  function handleStartGame() {
    navigate(`/game/${shortid.generate()}`);
  }

  function handleJoinGame() {
    navigate("/join");
  }

  return (
    <Container sx={{ maxWidth: "300px", height: "100%" }}>
      <Flex
        sx={{
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
        }}
      >
        <Text variant="display" sx={{ textAlign: "center" }}>
          Owlbear Rodeo
        </Text>
        <Image src={owlington} m={2} />
        <Button m={2} onClick={handleStartGame}>
          Start Game
        </Button>
        <Button m={2} onClick={handleJoinGame}>
          Join Game
        </Button>
        <Text variant="caption" sx={{ textAlign: "center" }}>
          Alpha v0.2.1
        </Text>
      </Flex>
    </Container>
  );
}

export default Home;

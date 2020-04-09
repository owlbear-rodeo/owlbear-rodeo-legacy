import React from "react";
import { Container, Flex, Button, Image, Text } from "theme-ui";
import shortid from "shortid";
import { useHistory } from "react-router-dom";

import owlington from "../images/Owlington.png";

function Home() {
  let history = useHistory();
  function handleStartGame() {
    history.push(`/game/${shortid.generate()}`);
  }

  function handleJoinGame() {
    history.push("/join");
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
        <Text variant="display" as="h1" sx={{ textAlign: "center" }}>
          Owlbear Rodeo
        </Text>
        <Image src={owlington} m={2} />
        <Button m={2} onClick={handleStartGame}>
          Start Game
        </Button>
        <Button m={2} onClick={handleJoinGame}>
          Join Game
        </Button>
        <Text variant="caption" as="p" sx={{ textAlign: "center" }}>
          Alpha v0.6.6
        </Text>
      </Flex>
    </Container>
  );
}

export default Home;

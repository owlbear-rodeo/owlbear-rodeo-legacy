import React from "react";
import { navigate } from "hookrouter";
import { Container, Flex, Button } from "theme-ui";

function Home() {
  return (
    <Container p={4} sx={{ maxWidth: "300px" }}>
      <Flex sx={{ flexDirection: "column" }}>
        <Button m={2} onClick={() => navigate("/game")}>
          Start Game
        </Button>
        <Button m={2} onClick={() => navigate("/join")}>
          Join Game
        </Button>
      </Flex>
    </Container>
  );
}

export default Home;

import React, { useContext } from "react";
import { navigate } from "hookrouter";
import { Container, Box, Label, Input, Button, Flex } from "theme-ui";

import GameContext from "../contexts/GameContext";

function Join() {
  const { gameId, setGameId } = useContext(GameContext);

  function handleChange(event) {
    setGameId(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    navigate("/game");
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
        <Box as="form" onSubmit={handleSubmit}>
          <Label htmlFor="id">Shove an ID in me</Label>
          <Input
            my={4}
            id="id"
            name="id"
            value={gameId || ""}
            onChange={handleChange}
          />
          <Button>Go ʕ•ᴥ•ʔ</Button>
        </Box>
      </Flex>
    </Container>
  );
}

export default Join;

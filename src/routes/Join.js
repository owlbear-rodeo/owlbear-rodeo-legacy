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
          <Label htmlFor="id">Let me see your identification</Label>
          <Input
            mt={1}
            mb={3}
            id="id"
            name="id"
            value={gameId || ""}
            onChange={handleChange}
          />
          <Button disabled={!gameId}>Join › (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</Button>
        </Box>
      </Flex>
    </Container>
  );
}

export default Join;

import React, { useState } from "react";
import { Container, Box, Label, Input, Button, Flex } from "theme-ui";
import { useHistory } from "react-router-dom";

function Join() {
  let history = useHistory();
  const [gameId, setGameId] = useState("");

  function handleChange(event) {
    setGameId(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    history.push(`/game/${gameId}`);
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

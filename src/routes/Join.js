import React, { useState } from "react";
import { Box, Label, Input, Button, Flex } from "theme-ui";
import { useHistory } from "react-router-dom";

import Footer from "../components/Footer";

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
    <Flex
      sx={{
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100%",
        alignItems: "center",
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "300px",
          flexGrow: 1,
        }}
        mb={2}
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
      <Footer />
    </Flex>
  );
}

export default Join;

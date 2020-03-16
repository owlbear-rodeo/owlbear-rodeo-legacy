import React, { useState } from "react";
import { navigate } from "hookrouter";
import { Container, Box, Label, Input, Button } from "theme-ui";

function Join() {
  const [id, setId] = useState("");

  function handleChange(event) {
    setId(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    navigate("/game");
  }

  return (
    <Container p={4} sx={{ maxWidth: "300px" }}>
      <Box as="form" onSubmit={handleSubmit}>
        <Label htmlFor="id">Shove an ID in me</Label>
        <Input my={4} id="id" name="id" value={id} onChange={handleChange} />
        <Button>Go ʕ•ᴥ•ʔ</Button>
      </Box>
    </Container>
  );
}

export default Join;

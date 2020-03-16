import React, { useEffect, useState, useRef } from "react";

import {
  ThemeProvider,
  Box,
  Heading,
  Text,
  Label,
  Input,
  Button
} from "theme-ui";
import theme from "./theme.js";

import useSession from "./useSession";

function App() {
  const [connectId, setConnectId] = useState("");
  const connectToId = () => {
    const connection = peer.connect(connectId);
    connection.on("open", () => {
      connection.on("data", data => {
        const blob = new Blob([data]);
        imgRef.current = blob;
        setImgSrc(URL.createObjectURL(imgRef.current));
      });
    });
  };

  const [imgSrc, setImgSrc] = useState("");
  const imgRef = useRef(null);
  const loadImage = e => {
    imgRef.current = e.target.files[0];
    setImgSrc(URL.createObjectURL(imgRef.current));
    for (let connection of Object.values(connections)) {
      connection.send(imgRef.current);
    }
  };

  const [peer, peerId, connections] = useSession(imgRef);

  return (
    <ThemeProvider theme={theme}>
      <Box width={256}>
        <Heading as="h3">Your ID</Heading>
        <Text>{peerId}</Text>

        <Box>
          <img src={imgSrc} />
          <Label htmlFor="image">Image</Label>
          <Input
            type="file"
            accept="image/*"
            name="image"
            id="file"
            onChange={loadImage}
          />
        </Box>

        <Box
          as="form"
          width={1 / 2}
          onSubmit={e => {
            e.preventDefault();
            connectToId();
          }}
          py={3}
        >
          <Label htmlFor="connectId">Connect to</Label>
          <Input
            id="connectId"
            name="connectId"
            value={connectId}
            onChange={e => setConnectId(e.target.value)}
          />
          <Button>Connect</Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;

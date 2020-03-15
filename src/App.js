import React, { useEffect, useState, useRef } from "react";
import Peer from "peerjs";

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

function App() {
  const [id, setId] = useState("");
  const peer = useRef(null);

  useEffect(() => {
    peer.current = new Peer();
  }, []);

  useEffect(() => {
    function handleOpen(id) {
      console.log("My peer ID is: " + id);
      setId(id);
    }

    function handleConnection(connection) {
      connection.on("open", () => {
        connection.on("data", data => {
          console.log(data);
        });

        connection.send(`You've connected to ${id}`);
      });
    }

    peer.current.on("open", handleOpen);
    peer.current.on("connection", handleConnection);
    return () => {
      peer.current.removeListener("open", handleOpen);
      peer.current.removeListener("connection", handleConnection);
    };
  }, [id]);

  const [connectId, setConnectId] = useState("");

  const connectToId = () => {
    const connection = peer.current.connect(connectId);
    connection.on("open", () => {
      connection.on("data", data => {
        console.log(data);
      });

      connection.send(`${id} connecting`);
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box width={256}>
        <Heading as="h3">Your ID</Heading>
        <Text>{id}</Text>
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

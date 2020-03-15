import React, { useEffect, useState, useRef } from "react";
import Peer from "peerjs";

import "./App.css";

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
    <div className="App">
      <header className="App-header">
        <h3>ID:</h3>
        <p>{id}</p>
        <br />
        <h4>Connect to ID:</h4>
        <input
          value={connectId}
          onChange={e => setConnectId(e.target.value)}
        ></input>
        <button onClick={connectToId}>Connect</button>
      </header>
    </div>
  );
}

export default App;

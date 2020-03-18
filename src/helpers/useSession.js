import { useEffect, useState } from "react";
import Peer from "peerjs";

function useSession(onConnectionOpen, onConnectionSync) {
  const [peerId, setPeerId] = useState(null);
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState({});
  function addConnection(connection) {
    setConnections(prevConnnections => ({
      ...prevConnnections,
      [connection.peer]: connection
    }));
  }

  useEffect(() => {
    setPeer(new Peer());
  }, []);

  useEffect(() => {
    function handleOpen(id) {
      setPeerId(id);
    }

    function handleConnection(connection) {
      connection.on("open", () => {
        const metadata = connection.metadata;
        if (metadata.sync) {
          connection.send({
            id: "sync",
            data: Object.keys(connections)
          });
          if (onConnectionSync) {
            onConnectionSync(connection);
          }
        }

        addConnection(connection);

        if (onConnectionOpen) {
          onConnectionOpen(connection);
        }
      });

      function removeConnection() {
        setConnections(prevConnections => {
          const { [connection.peer]: old, ...rest } = prevConnections;
          return rest;
        });
      }

      connection.on("close", removeConnection);
      connection.on("error", removeConnection);
    }

    if (!peer) {
      return;
    }

    peer.on("open", handleOpen);
    peer.on("connection", handleConnection);
    return () => {
      peer.removeListener("open", handleOpen);
      peer.removeListener("connection", handleConnection);
    };
  }, [peer, peerId, connections, onConnectionOpen]);

  function sync(connectionIds) {
    for (let connectionId of connectionIds) {
      if (connectionId in connections) {
        continue;
      }
      const connection = peer.connect(connectionId, {
        metadata: { sync: false }
      });
      addConnection(connection);
    }
  }

  function connectTo(connectionId) {
    if (connectionId in connections) {
      return;
    }
    const connection = peer.connect(connectionId, {
      metadata: { sync: true }
    });
    connection.on("open", () => {
      connection.on("data", data => {
        if (data.id === "sync") {
          sync(data.data);
        }
      });
      if (onConnectionOpen) {
        onConnectionOpen(connection);
      }
    });
    addConnection(connection);
  }

  return [peer, peerId, connections, connectTo];
}

export default useSession;

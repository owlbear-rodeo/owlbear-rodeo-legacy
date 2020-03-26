import { useEffect, useState } from "react";
import Peer from "peerjs";

function useSession(onConnectionOpen, onConnectionSync) {
  const [peerId, setPeerId] = useState(null);
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState({});

  function addConnection(connection) {
    console.log("Adding connection", connection.peer);
    setConnections(prevConnnections => {
      console.log("Connections", {
        ...prevConnnections,
        [connection.peer]: connection
      });
      return {
        ...prevConnnections,
        [connection.peer]: connection
      };
    });
  }

  useEffect(() => {
    console.log("Creating peer");
    setPeer(new Peer());
  }, []);

  useEffect(() => {
    function handleOpen(id) {
      console.log("Peer open", id);
      setPeerId(id);
    }

    function handleConnection(connection) {
      connection.on("open", () => {
        console.log("incoming connection added", connection.peer);
        const metadata = connection.metadata;
        if (metadata.sync) {
          connection.send({
            id: "sync",
            data: { connections: Object.keys(connections) }
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
        console.log("removing connection", connection.peer);
        setConnections(prevConnections => {
          const { [connection.peer]: old, ...rest } = prevConnections;
          return rest;
        });
      }
      connection.on("close", removeConnection);
      connection.on("error", error => {
        console.error("Data Connection error", error);
        removeConnection();
      });
    }

    function handleError(error) {
      console.error("Peer error", error);
    }

    if (!peer) {
      return;
    }

    peer.on("open", handleOpen);
    peer.on("connection", handleConnection);
    peer.on("error", handleError);
    return () => {
      peer.removeListener("open", handleOpen);
      peer.removeListener("connection", handleConnection);
      peer.removeListener("error", handleError);
    };
  }, [peer, peerId, connections, onConnectionOpen, onConnectionSync]);

  function connectTo(connectionId) {
    console.log("Connecting to", connectionId);
    if (connectionId in connections) {
      return;
    }
    const connection = peer.connect(connectionId, {
      metadata: { sync: true }
    });
    addConnection(connection);
    connection.on("open", () => {
      connection.on("data", data => {
        if (data.id === "sync") {
          const { connections: syncConnections } = data.data;
          for (let syncId of syncConnections) {
            console.log("Syncing to", syncId);
            if (connectionId === syncId || syncId in connections) {
              continue;
            }
            const syncConnection = peer.connect(syncId, {
              metadata: { sync: false }
            });
            addConnection(syncConnection);
          }
        }
      });
      if (onConnectionOpen) {
        onConnectionOpen(connection);
      }
    });
  }

  return { peer, peerId, connections, connectTo };
}

export default useSession;

import { useEffect, useState } from "react";
import Peer from "peerjs";

const getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

function useSession(onConnectionOpen, onConnectionSync) {
  const [peerId, setPeerId] = useState(null);
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState({});
  const [streams, setStreams] = useState({});

  function addConnection(connection) {
    setConnections(prevConnnections => ({
      ...prevConnnections,
      [connection.peer]: connection
    }));
  }

  function addStream(stream, id) {
    setStreams(prevStreams => ({
      ...prevStreams,
      [id]: stream
    }));
  }

  useEffect(() => {
    setPeer(new Peer());
  }, []);

  // Clean up stream on dismount
  useEffect(() => {
    return () => {
      for (let stream of Object.values(streams)) {
        for (let track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [streams]);

  useEffect(() => {
    function handleOpen(id) {
      setPeerId(id);

      getUserMedia({ video: true, audio: true }, stream => {
        addStream(stream, id);
      });
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

        addConnection(connection, false);

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

    function handleCall(call) {
      call.answer(streams[peerId]);
      call.on("stream", remoteStream => {
        addStream(remoteStream, call.peer);
      });
    }

    if (!peer) {
      return;
    }

    peer.on("open", handleOpen);
    peer.on("connection", handleConnection);
    peer.on("call", handleCall);
    return () => {
      peer.removeListener("open", handleOpen);
      peer.removeListener("connection", handleConnection);
      peer.removeListener("call", handleCall);
    };
  }, [peer, peerId, connections, onConnectionOpen, onConnectionSync, streams]);

  function sync(connectionIds) {
    for (let connectionId of connectionIds) {
      if (connectionId in connections) {
        continue;
      }
      const connection = peer.connect(connectionId, {
        metadata: { sync: false }
      });
      addConnection(connection, false);
      const call = peer.call(connectionId, streams[peerId]);
      call.on("stream", stream => {
        addStream(stream, connectionId);
      });
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

    console.log(streams);

    const call = peer.call(connectionId, streams[peerId]);
    call.on("stream", remoteStream => {
      addStream(remoteStream, connectionId);
    });

    addConnection(connection, false);
  }

  return { peer, peerId, streams, connections, connectTo };
}

export default useSession;

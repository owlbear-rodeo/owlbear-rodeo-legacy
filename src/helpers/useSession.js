import { useEffect, useState, useRef } from "react";
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
  // Keep a ref to the streams in order to clean them up on unmount
  const streamsRef = useRef(streams);

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

  function addStream(stream, id) {
    console.log("Adding stream", id);
    setStreams(prevStreams => {
      console.log("Streams", {
        ...prevStreams,
        [id]: stream
      });
      return {
        ...prevStreams,
        [id]: stream
      };
    });
  }

  useEffect(() => {
    console.log("Creating peer");
    setPeer(new Peer());

    return () => {
      console.log("Cleaning up streams");
      for (let stream of Object.values(streamsRef.current)) {
        for (let track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  // Update stream refs
  useEffect(() => {
    console.log("Syncing stream ref to stream state", streams);
    streamsRef.current = streams;
  }, [streams, streamsRef]);

  useEffect(() => {
    function handleOpen(id) {
      console.log("Peer open", id);
      setPeerId(id);

      console.log("Getting user data");
      getUserMedia(
        {
          video: {
            frameRate: { ideal: 15, max: 20 },
            width: { max: 256 },
            height: { max: 144 }
          },
          audio: false
        },
        stream => {
          addStream(stream, id);
        }
      );
    }

    function handleConnection(connection) {
      connection.on("open", () => {
        console.log("incoming connection added", connection.peer);
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

    function handleCall(call) {
      console.log("incoming call", call.peer);
      call.answer(streams[peerId]);
      call.on("stream", remoteStream => {
        addStream(remoteStream, call.peer);
      });
      function removeStream() {
        setStreams(prevStreams => {
          const { [call.peer]: old, ...rest } = prevStreams;
          return rest;
        });
      }
      call.on("close", removeStream);
      call.on("error", error => {
        console.error("Media Connection error", error);
        removeStream();
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
    peer.on("call", handleCall);
    peer.on("error", handleError);
    return () => {
      peer.removeListener("open", handleOpen);
      peer.removeListener("connection", handleConnection);
      peer.removeListener("call", handleCall);
      peer.removeListener("error", handleError);
    };
  }, [peer, peerId, connections, onConnectionOpen, onConnectionSync, streams]);

  function call(connectionId) {
    console.log("Calling", connectionId);
    const call = peer.call(connectionId, streams[peerId]);
    call.on("stream", stream => {
      addStream(stream, connectionId);
    });
  }

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
          for (let syncId of data.data) {
            console.log("Syncing to", syncId);
            if (connectionId === syncId || syncId in connections) {
              continue;
            }
            const syncConnection = peer.connect(syncId, {
              metadata: { sync: false }
            });
            addConnection(syncConnection);
            call(syncId);
          }
        }
      });
      if (onConnectionOpen) {
        onConnectionOpen(connection);
      }
    });
    call(connectionId);
  }

  return { peer, peerId, streams, connections, connectTo };
}

export default useSession;

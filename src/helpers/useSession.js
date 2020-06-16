import { useEffect, useState, useContext, useCallback } from "react";
import io from "socket.io-client";

import { omit } from "../helpers/shared";
import Peer from "../helpers/Peer";

import AuthContext from "../contexts/AuthContext";

const socket = io(process.env.REACT_APP_BROKER_URL);

function useSession(
  partyId,
  onPeerConnected,
  onPeerDisconnected,
  onPeerData,
  onPeerTrackAdded,
  onPeerTrackRemoved,
  onPeerError
) {
  const { password, setAuthenticationStatus } = useContext(AuthContext);
  const [iceServers, setIceServers] = useState([]);
  const [connected, setConnected] = useState(false);

  const joinParty = useCallback(async () => {
    try {
      const response = await fetch(process.env.REACT_APP_ICE_SERVERS_URL);
      const data = await response.json();
      setIceServers(data.iceServers);
      socket.emit("join party", partyId, password);
    } catch (e) {
      console.error("Unable to join party:", e.message);
      setConnected(false);
    }
  }, [partyId, password]);

  useEffect(() => {
    joinParty();
  }, [partyId, password, joinParty]);

  const [peers, setPeers] = useState({});

  // Signal connected peers of a closure on refresh
  useEffect(() => {
    function handleUnload() {
      for (let peer of Object.values(peers)) {
        peer.connection.send({ id: "close" });
      }
    }
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [peers]);

  // Setup event listeners for peers
  useEffect(() => {
    let peerEvents = [];
    for (let peer of Object.values(peers)) {
      function handleSignal(signal) {
        socket.emit("signal", JSON.stringify({ to: peer.id, signal }));
      }

      function handleConnect() {
        onPeerConnected && onPeerConnected(peer);
        if (peer.sync) {
          peer.connection.send({ id: "sync" });
        }
      }

      function handleDataComplete(data) {
        if (data.id === "close") {
          // Close connection when signaled to close
          peer.connection.destroy();
        }
        onPeerData && onPeerData({ peer, data });
      }

      function handleTrack(track, stream) {
        onPeerTrackAdded && onPeerTrackAdded({ peer, track, stream });
        track.addEventListener("mute", () => {
          onPeerTrackRemoved && onPeerTrackRemoved({ peer, track, stream });
        });
      }

      function handleClose() {
        onPeerDisconnected && onPeerDisconnected(peer);
        peer.connection.destroy();
        setPeers((prevPeers) => omit(prevPeers, [peer.id]));
      }

      function handleError(error) {
        onPeerError && onPeerError({ peer, error });
      }

      peer.connection.on("signal", handleSignal);
      peer.connection.on("connect", handleConnect);
      peer.connection.on("dataComplete", handleDataComplete);
      peer.connection.on("track", handleTrack);
      peer.connection.on("close", handleClose);
      peer.connection.on("error", handleError);
      // Save events for cleanup
      peerEvents.push({
        peer,
        handleSignal,
        handleConnect,
        handleDataComplete,
        handleTrack,
        handleClose,
        handleError,
      });
    }

    // Cleanup events
    return () => {
      for (let {
        peer,
        handleSignal,
        handleConnect,
        handleDataComplete,
        handleTrack,
        handleClose,
        handleError,
      } of peerEvents) {
        peer.connection.off("signal", handleSignal);
        peer.connection.off("connect", handleConnect);
        peer.connection.off("dataComplete", handleDataComplete);
        peer.connection.off("track", handleTrack);
        peer.connection.off("close", handleClose);
        peer.connection.off("error", handleError);
      }
    };
  }, [
    peers,
    onPeerConnected,
    onPeerDisconnected,
    onPeerData,
    onPeerTrackAdded,
    onPeerTrackRemoved,
    onPeerError,
  ]);

  // Setup event listeners for the socket
  useEffect(() => {
    function addPeer(id, initiator, sync) {
      const connection = new Peer({
        initiator,
        trickle: true,
        config: { iceServers },
      });

      setPeers((prevPeers) => ({
        ...prevPeers,
        [id]: { id, connection, initiator, sync },
      }));
    }

    function handlePartyMemberJoined(id) {
      addPeer(id, false, false);
    }

    function handlePartyMemberLeft(id) {
      if (id in peers) {
        peers[id].connection.destroy();
        setPeers((prevPeers) => omit(prevPeers, [id]));
      }
    }

    function handleJoinedParty(otherIds) {
      for (let [index, id] of otherIds.entries()) {
        // Send a sync request to the first member of the party
        const sync = index === 0;
        addPeer(id, true, sync);
      }
      setAuthenticationStatus("authenticated");
      setConnected(true);
    }

    function handleSignal(data) {
      const { from, signal } = JSON.parse(data);
      if (from in peers) {
        peers[from].connection.signal(signal);
      }
    }

    function handleAuthError() {
      setAuthenticationStatus("unauthenticated");
    }

    function handleSocketDisconnect() {
      setConnected(false);
    }

    function handleSocketReconnect() {
      setConnected(true);
      joinParty();
    }

    socket.on("disconnect", handleSocketDisconnect);
    socket.on("reconnect", handleSocketReconnect);

    socket.on("party member joined", handlePartyMemberJoined);
    socket.on("party member left", handlePartyMemberLeft);
    socket.on("joined party", handleJoinedParty);
    socket.on("signal", handleSignal);
    socket.on("auth error", handleAuthError);
    return () => {
      socket.off("disconnect", handleSocketDisconnect);
      socket.off("reconnect", handleSocketReconnect);

      socket.off("party member joined", handlePartyMemberJoined);
      socket.off("party member left", handlePartyMemberLeft);
      socket.off("joined party", handleJoinedParty);
      socket.off("signal", handleSignal);
      socket.off("auth error", handleAuthError);
    };
  }, [peers, setAuthenticationStatus, iceServers, joinParty]);

  return { peers, socket, connected };
}

export default useSession;

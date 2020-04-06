import { useEffect, useState } from "react";
import io from "socket.io-client";

import { omit } from "../helpers/shared";
import Peer from "../helpers/Peer";

const socket = io("https://broker.owlbear.rodeo");

function useSession(partyId, onPeerConnected, onPeerDisconnected, onPeerData) {
  useEffect(() => {
    socket.emit("join party", partyId);
  }, [partyId]);

  const [peers, setPeers] = useState({});

  useEffect(() => {
    function addPeer(id, initiator) {
      const peer = new Peer({ initiator, trickle: false });

      peer.on("signal", (signal) => {
        socket.emit("signal", JSON.stringify({ to: id, signal }));
      });

      peer.on("connect", () => {
        onPeerConnected && onPeerConnected({ id, peer, initiator });
      });

      peer.on("dataComplete", (data) => {
        onPeerData && onPeerData({ id, peer, data });
      });

      peer.on("close", () => {
        onPeerDisconnected && onPeerDisconnected(id);
      });

      peer.on("error", (err) => {
        onPeerDisconnected && onPeerDisconnected(id);
        console.error("error", err);
      });

      setPeers((prevPeers) => ({
        ...prevPeers,
        [id]: peer,
      }));
    }

    function handlePartyMemberJoined(id) {
      addPeer(id, false);
    }

    function handlePartyMemberLeft(id) {
      if (id in peers) {
        peers[id].destroy();
      }
      setPeers((prevPeers) => omit(prevPeers, [id]));
    }

    function handleJoinedParty(otherIds) {
      for (let id of otherIds) {
        addPeer(id, true);
      }
    }

    function handleSignal(data) {
      const { from, signal } = JSON.parse(data);
      if (from in peers) {
        peers[from].signal(signal);
      }
    }

    socket.on("party member joined", handlePartyMemberJoined);
    socket.on("party member left", handlePartyMemberLeft);
    socket.on("joined party", handleJoinedParty);
    socket.on("signal", handleSignal);
    return () => {
      socket.removeListener("party member joined", handlePartyMemberJoined);
      socket.removeListener("party member left", handlePartyMemberLeft);
      socket.removeListener("joined party", handleJoinedParty);
      socket.removeListener("signal", handleSignal);
    };
  }, [peers, onPeerConnected, onPeerDisconnected, onPeerData]);

  return { peers, socket };
}

export default useSession;

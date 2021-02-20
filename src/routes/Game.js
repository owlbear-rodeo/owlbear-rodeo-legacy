import React, { useState, useEffect, useRef } from "react";
import { Flex, Box, Text } from "theme-ui";
import { useParams } from "react-router-dom";

import Banner from "../components/Banner";
import LoadingOverlay from "../components/LoadingOverlay";
import Link from "../components/Link";
import MapLoadingOverlay from "../components/map/MapLoadingOverlay";

import AuthModal from "../modals/AuthModal";

import { useAuth } from "../contexts/AuthContext";
import { MapStageProvider } from "../contexts/MapStageContext";
import { useDatabase } from "../contexts/DatabaseContext";
import { PlayerProvider } from "../contexts/PlayerContext";
import { PartyProvider } from "../contexts/PartyContext";

import NetworkedMapAndTokens from "../network/NetworkedMapAndTokens";
import NetworkedParty from "../network/NetworkedParty";

import Session from "../network/Session";

function Game() {
  const { id: gameId } = useParams();
  const { password } = useAuth();
  const { databaseStatus } = useDatabase();

  const [session] = useState(new Session());
  const [sessionStatus, setSessionStatus] = useState();

  useEffect(() => {
    async function connect() {
      await session.connect();
    }
    connect();

    return () => {
      session.disconnect();
    };
  }, [session]);

  // Handle session errors
  const [peerError, setPeerError] = useState(null);
  useEffect(() => {
    function handlePeerError({ error }) {
      if (error.code === "ERR_WEBRTC_SUPPORT") {
        setPeerError("WebRTC not supported.");
      } else if (error.code === "ERR_CREATE_OFFER") {
        setPeerError("Unable to connect to party.");
      }
    }
    session.on("peerError", handlePeerError);
    return () => {
      session.off("peerError", handlePeerError);
    };
  }, [session]);

  useEffect(() => {
    function handleStatus(status) {
      setSessionStatus(status);
    }

    session.on("status", handleStatus);

    return () => {
      session.off("status", handleStatus);
    };
  }, [session]);

  // Join game
  useEffect(() => {
    if (sessionStatus === "ready" && databaseStatus !== "loading") {
      session.joinGame(gameId, password);
    }
  }, [gameId, password, databaseStatus, session, sessionStatus]);

  function handleAuthSubmit(newPassword) {
    if (databaseStatus !== "loading") {
      session.joinGame(gameId, newPassword);
    }
  }

  // A ref to the Konva stage
  // the ref will be assigned in the MapInteraction component
  const mapStageRef = useRef();

  return (
    <PlayerProvider session={session}>
      <PartyProvider session={session}>
        <MapStageProvider value={mapStageRef}>
          <Flex sx={{ flexDirection: "column", height: "100%" }}>
            <Flex
              sx={{
                justifyContent: "space-between",
                flexGrow: 1,
                height: "100%",
              }}
            >
              <NetworkedParty session={session} gameId={gameId} />
              <NetworkedMapAndTokens session={session} />
            </Flex>
          </Flex>
          <Banner
            isOpen={!!peerError}
            onRequestClose={() => setPeerError(null)}
          >
            <Box p={1}>
              <Text as="p" variant="body2">
                {peerError} See <Link to="/faq#connection">FAQ</Link> for more
                information.
              </Text>
            </Box>
          </Banner>
          <Banner
            isOpen={sessionStatus === "offline"}
            onRequestClose={() => {}}
            allowClose={false}
          >
            <Box p={1}>
              <Text as="p" variant="body2">
                Unable to connect to game, refresh to reconnect.
              </Text>
            </Box>
          </Banner>
          <Banner
            isOpen={sessionStatus === "reconnecting"}
            onRequestClose={() => {}}
            allowClose={false}
          >
            <Box p={1}>
              <Text as="p" variant="body2">
                Disconnected. Attempting to reconnect...
              </Text>
            </Box>
          </Banner>
          <AuthModal
            isOpen={sessionStatus === "auth"}
            onSubmit={handleAuthSubmit}
          />
          {!sessionStatus && <LoadingOverlay />}
          <MapLoadingOverlay />
        </MapStageProvider>
      </PartyProvider>
    </PlayerProvider>
  );
}

export default Game;

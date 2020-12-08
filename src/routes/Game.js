import React, { useState, useEffect, useContext, useRef } from "react";
import { Flex, Box, Text } from "theme-ui";
import { useParams } from "react-router-dom";

import Banner from "../components/Banner";
import LoadingOverlay from "../components/LoadingOverlay";
import Link from "../components/Link";
import MapLoadingOverlay from "../components/map/MapLoadingOverlay";

import AuthModal from "../modals/AuthModal";

import AuthContext from "../contexts/AuthContext";
import { MapStageProvider } from "../contexts/MapStageContext";
import DatabaseContext from "../contexts/DatabaseContext";
import { PlayerProvider } from "../contexts/PlayerContext";

import NetworkedMapAndTokens from "../network/NetworkedMapAndTokens";
import NetworkedParty from "../network/NetworkedParty";

import Session from "../network/Session";

function Game() {
  const { id: gameId } = useParams();
  const {
    authenticationStatus,
    password,
    setAuthenticationStatus,
  } = useContext(AuthContext);
  const { databaseStatus } = useContext(DatabaseContext);

  const [session] = useState(new Session());
  const [offline, setOffline] = useState();
  useEffect(() => {
    async function connect() {
      await session.connect();
      setOffline(session.state === "offline");
    }
    connect();
  }, [session]);

  // Handle authentication status
  useEffect(() => {
    function handleAuthSuccess() {
      setAuthenticationStatus("authenticated");
    }
    function handleAuthError() {
      setAuthenticationStatus("unauthenticated");
    }
    session.on("authenticationSuccess", handleAuthSuccess);
    session.on("authenticationError", handleAuthError);

    return () => {
      session.off("authenticationSuccess", handleAuthSuccess);
      session.off("authenticationError", handleAuthError);
    };
  }, [setAuthenticationStatus, session]);

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
    session.on("error", handlePeerError);
    return () => {
      session.off("error", handlePeerError);
    };
  }, [session]);

  // Handle connection
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    function handleConnected() {
      setConnected(true);
    }

    function handleDisconnected() {
      setConnected(false);
    }

    session.on("connected", handleConnected);
    session.on("disconnected", handleDisconnected);

    return () => {
      session.off("connected", handleConnected);
      session.off("disconnected", handleDisconnected);
    };
  }, [session]);

  // Join game
  useEffect(() => {
    if (session.state === "online" && databaseStatus !== "loading") {
      session.joinGame(gameId, password);
    }
  }, [gameId, password, databaseStatus, session, offline]);

  // A ref to the Konva stage
  // the ref will be assigned in the MapInteraction component
  const mapStageRef = useRef();

  return (
    <PlayerProvider session={session}>
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
        <Banner isOpen={!!peerError} onRequestClose={() => setPeerError(null)}>
          <Box p={1}>
            <Text as="p" variant="body2">
              {peerError} See <Link to="/faq#connection">FAQ</Link> for more
              information.
            </Text>
          </Box>
        </Banner>
        <Banner isOpen={offline} onRequestClose={() => {}} allowClose={false}>
          <Box p={1}>
            <Text as="p" variant="body2">
              Unable to connect to game, refresh to reconnect.
            </Text>
          </Box>
        </Banner>
        <Banner
          isOpen={!connected && authenticationStatus === "authenticated"}
          onRequestClose={() => {}}
          allowClose={false}
        >
          <Box p={1}>
            <Text as="p" variant="body2">
              Disconnected. Attempting to reconnect...
            </Text>
          </Box>
        </Banner>
        <AuthModal isOpen={authenticationStatus === "unauthenticated"} />
        {authenticationStatus === "unknown" && !offline && <LoadingOverlay />}
        <MapLoadingOverlay />
      </MapStageProvider>
    </PlayerProvider>
  );
}

export default Game;
